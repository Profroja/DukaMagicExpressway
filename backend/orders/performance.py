"""Staff performance: the orders a staff member received and closed, and the money collected.

How it is counted for a date range (days in Tanzania time):

* Orders received - customer orders placed in the range that the person can
  see (their city's orders plus orders with no city; admins see all).
* Orders closed / money collected - orders the person closed in the range and
  the exact amount the customer paid, recorded when closing.
* An admin sees the whole team (with a per-staff table) or one staff member
  with ?staff=<user id>.

Used by the website (/api/admin/orders/performance/) and the staff app
(/api/staff/performance/).
"""

import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.http import JsonResponse

from auths.views import _handles_orders, _is_admin

from .models import QuickOrder, QuickOrderStatus
from .views import _visible_orders

User = get_user_model()

TZ = ZoneInfo("Africa/Dar_es_Salaam")
ZERO = Decimal("0")
MAX_DAYS = 366
TABLE_LIMIT = 300
OPEN_STATUSES = [
    QuickOrderStatus.NEW,
    QuickOrderStatus.CONTACTED,
    QuickOrderStatus.CONFIRMED,
    QuickOrderStatus.SOURCING,
    QuickOrderStatus.PICKED_UP,
    QuickOrderStatus.DELIVERED,
]


def today():
    return datetime.now(TZ).date()


def _parse_day(value, default):
    try:
        return date.fromisoformat((value or "").strip())
    except ValueError:
        return default


def parse_range(params):
    """[from, to] days from ?from=YYYY-MM-DD&to=YYYY-MM-DD (default: today)."""
    now = today()
    start = _parse_day(params.get("from"), now)
    end = _parse_day(params.get("to"), start)
    if end < start:
        start, end = end, start
    if (end - start).days >= MAX_DAYS:
        start = end - timedelta(days=MAX_DAYS - 1)
    return start, end


def _bounds(start, end):
    """Aware [start of first day, start of the day after the last)."""
    return (
        datetime.combine(start, time.min, tzinfo=TZ),
        datetime.combine(end + timedelta(days=1), time.min, tzinfo=TZ),
    )


def _name(user):
    if user is None:
        return ""
    return user.get_full_name() or user.get_username()


def _money(value):
    return str(value if value is not None else ZERO)


def _row(order):
    return {
        "id": str(order.pk),
        "product_title": order.listing.title,
        "listing_type": order.listing.listing_type,
        "quantity": order.quantity,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "city": order.city,
        "status": order.status,
        "status_label": str(QuickOrderStatus(order.status).label),
        "grand_total": _money(order.total_amount + order.delivery_fee),
        "amount_paid": _money(order.amount_paid) if order.amount_paid is not None else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "closed_at": order.closed_at.isoformat() if order.closed_at else None,
        "closed_by": _name(order.closed_by),
        "currency": order.currency,
    }


def _scope(viewer, staff_id):
    """(subject user, team mode). Admins see the team unless they pick one staff member."""
    if _is_admin(viewer):
        try:
            picked = User.objects.filter(pk=uuid.UUID(str(staff_id))).first() if staff_id else None
        except ValueError:
            picked = None
        if picked is not None:
            return picked, False
        return viewer, True
    return viewer, False


def _closed_in(queryset, start_at, end_at):
    return queryset.filter(status=QuickOrderStatus.CLOSED, closed_at__gte=start_at, closed_at__lt=end_at)


def staff_performance(viewer, start, end, staff_id=None):
    subject, team = _scope(viewer, staff_id)
    base = QuickOrder.objects.select_related("listing", "closed_by")
    visible = base if team else _visible_orders(subject, base)
    closed_scope = base if team else base.filter(closed_by=subject)

    start_at, end_at = _bounds(start, end)
    received = visible.filter(created_at__gte=start_at, created_at__lt=end_at)
    closed = _closed_in(closed_scope, start_at, end_at)

    t = today()
    t_start, t_end = _bounds(t, t)
    today_closed = _closed_in(closed_scope, t_start, t_end)

    collected = closed.aggregate(s=Sum("amount_paid"))["s"] or ZERO
    closed_count = closed.count()

    # One row per day for the chart and the daily table.
    days = {}
    day = start
    while day <= end:
        days[day] = {"date": day.isoformat(), "received": 0, "closed": 0, "collected": ZERO}
        day += timedelta(days=1)
    for created_at in received.values_list("created_at", flat=True):
        days[created_at.astimezone(TZ).date()]["received"] += 1
    for closed_at, paid in closed.values_list("closed_at", "amount_paid"):
        bucket = days[closed_at.astimezone(TZ).date()]
        bucket["closed"] += 1
        bucket["collected"] += paid or ZERO

    payload = {
        "range": {"from": start.isoformat(), "to": end.isoformat()},
        "team": team,
        "person": {
            "id": str(subject.pk),
            "name": _name(subject),
            "city": getattr(subject, "city", "") or "",
            "role": subject.role,
        },
        "today": {
            "date": t.isoformat(),
            "received": visible.filter(created_at__gte=t_start, created_at__lt=t_end).count(),
            "closed": today_closed.count(),
            "collected": _money(today_closed.aggregate(s=Sum("amount_paid"))["s"]),
        },
        "totals": {
            "received": received.count(),
            "closed": closed_count,
            "collected": _money(collected),
            "average": _money((collected / closed_count).quantize(Decimal("0.01")) if closed_count else ZERO),
            "delivered": visible.filter(delivered_at__gte=start_at, delivered_at__lt=end_at).count(),
            "cancelled": received.filter(status=QuickOrderStatus.CANCELLED).count(),
        },
        # Work waiting right now (not limited to the range).
        "open": {
            status.value: visible.filter(status=status).count() for status in OPEN_STATUSES
        },
        "daily": [
            {**row, "collected": _money(row["collected"])} for row in days.values()
        ],
        "closed_orders": [_row(o) for o in closed.order_by("-closed_at")[:TABLE_LIMIT]],
        "received_orders": [_row(o) for o in received.order_by("-created_at")[:TABLE_LIMIT]],
    }

    if team:
        per_staff = (
            closed.exclude(closed_by=None)
            .values("closed_by")
            .annotate(closed=Count("id"), collected=Sum("amount_paid"))
            .order_by("-collected")
        )
        people = {u.pk: u for u in User.objects.filter(pk__in=[r["closed_by"] for r in per_staff])}
        payload["by_staff"] = [
            {
                "id": str(r["closed_by"]),
                "name": _name(people.get(r["closed_by"])),
                "city": getattr(people.get(r["closed_by"]), "city", "") or "",
                "closed": r["closed"],
                "collected": _money(r["collected"]),
            }
            for r in per_staff
        ]
    if _is_admin(viewer):
        # Admins can switch between the team and one staff member.
        payload["staff_options"] = [
            {"id": str(u.pk), "name": _name(u), "city": u.city or ""}
            for u in User.objects.filter(role="staff", is_active=True).order_by("first_name", "phone_number")
        ]
    return payload


def admin_performance_view(request):
    """Website: GET ?from=&to=[&staff=] - the signed-in staff member's (or team's) numbers."""
    if not _handles_orders(request.user):
        return JsonResponse({"error": "Forbidden"}, status=403)
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    start, end = parse_range(request.GET)
    return JsonResponse(staff_performance(request.user, start, end, request.GET.get("staff")))
