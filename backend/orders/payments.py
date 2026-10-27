"""Lipa numbers: where customers pay before sending an order.

Admins keep the list on the website (/api/admin/payment-accounts/). Customers
see the active ones on the order form (/api/payment-accounts/), pay, tap
"Nimeshalipia" and the order records which number they paid to.
"""
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from auths.views import _is_admin

from .models import LipaProvider, PaymentAccount


def account_label(account):
    """How a paid-to number is remembered on the order, e.g. "M-Pesa 123456 (SokoLink Ltd)"."""
    return f"{account.label} {account.number} ({account.account_name})"[:200]


def _account_payload(account):
    return {
        "id": str(account.pk),
        "provider": account.provider,
        "provider_label": account.label,
        "provider_name": account.provider_name,
        "number": account.number,
        "account_name": account.account_name,
        "note": account.note,
        "is_active": account.is_active,
        "sort_order": account.sort_order,
    }


def customer_payment_payload(order):
    """What the customer said about paying, for admins and staff (None if they didn't pay ahead)."""
    if not order.customer_paid:
        return None
    try:
        provider_label = str(LipaProvider(order.customer_payment_provider).label)
    except ValueError:
        provider_label = order.customer_payment_provider
    return {
        "provider": order.customer_payment_provider,
        "provider_label": provider_label,
        "account": order.customer_payment_account,
        "reference": order.customer_payment_reference,
        "paid_at": order.customer_paid_at.isoformat() if order.customer_paid_at else None,
    }


def public_payment_accounts_view(request):
    """GET: active lipa numbers for the order form."""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    accounts = PaymentAccount.objects.filter(is_active=True)
    return JsonResponse({"accounts": [_account_payload(a) for a in accounts]})


def _read(request):
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "Invalid JSON body"}, status=400)
    if not isinstance(data, dict):
        return None, JsonResponse({"error": "Invalid JSON body"}, status=400)
    return data, None


def _apply(account, data, partial):
    """Copy fields from the request onto the account; returns an error message or ""."""
    if "provider" in data or not partial:
        provider = str(data.get("provider") or "").strip()
        if provider not in LipaProvider.values:
            return "Choose the provider (M-Pesa, Mixx, Airtel Money...)."
        account.provider = provider
    if "provider_name" in data:
        account.provider_name = str(data.get("provider_name") or "").strip()[:60]
    if "number" in data or not partial:
        number = str(data.get("number") or "").strip()
        if not number:
            return "Enter the lipa number."
        if len(number) > 40:
            return "The number is too long."
        account.number = number
    if "account_name" in data or not partial:
        name = str(data.get("account_name") or "").strip()
        if not name:
            return "Enter the account name customers will see when paying."
        account.account_name = name[:120]
    if "note" in data:
        account.note = str(data.get("note") or "").strip()[:200]
    if "is_active" in data:
        account.is_active = bool(data.get("is_active"))
    if "sort_order" in data:
        try:
            account.sort_order = max(0, min(999, int(data.get("sort_order") or 0)))
        except (TypeError, ValueError):
            return "Enter a valid position."
    if account.provider in (LipaProvider.BANK, LipaProvider.OTHER) and not account.provider_name:
        return "Enter the bank / provider name."
    return ""


def _all_accounts():
    return [_account_payload(a) for a in PaymentAccount.objects.all()]


@csrf_exempt
def admin_payment_accounts_view(request):
    """Admin: GET every lipa number (active or not), POST to add one."""
    if not _is_admin(request.user):
        return JsonResponse({"error": "Forbidden"}, status=403)
    if request.method == "GET":
        return JsonResponse({
            "accounts": _all_accounts(),
            "providers": [{"value": p.value, "label": str(p.label)} for p in LipaProvider],
        })
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data, error = _read(request)
    if error:
        return error
    account = PaymentAccount(sort_order=PaymentAccount.objects.count())
    problem = _apply(account, data, partial=False)
    if problem:
        return JsonResponse({"error": problem}, status=400)
    account.updated_by = request.user
    account.save()
    return JsonResponse({"success": True, "account": _account_payload(account), "accounts": _all_accounts()}, status=201)


@csrf_exempt
def admin_payment_account_detail_view(request, account_id):
    """Admin: PATCH to edit / switch on-off, DELETE to remove."""
    if not _is_admin(request.user):
        return JsonResponse({"error": "Forbidden"}, status=403)
    account = PaymentAccount.objects.filter(pk=account_id).first()
    if account is None:
        return JsonResponse({"error": "Not found."}, status=404)
    if request.method == "DELETE":
        account.delete()
        return JsonResponse({"success": True, "accounts": _all_accounts()})
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data, error = _read(request)
    if error:
        return error
    problem = _apply(account, data, partial=True)
    if problem:
        return JsonResponse({"error": problem}, status=400)
    account.updated_by = request.user
    account.save()
    return JsonResponse({"success": True, "account": _account_payload(account), "accounts": _all_accounts()})

