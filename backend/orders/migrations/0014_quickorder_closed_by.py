import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_closed_by(apps, schema_editor):
    """Orders closed before this field existed: the last person to touch them closed them."""
    QuickOrder = apps.get_model("orders", "QuickOrder")
    for order in QuickOrder.objects.filter(status="closed", closed_by__isnull=True).exclude(updated_by=None):
        order.closed_by_id = order.updated_by_id
        order.save(update_fields=["closed_by"])


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0013_store_payment_details'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='quickorder',
            name='closed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_quick_orders', to=settings.AUTH_USER_MODEL),
        ),
        migrations.RunPython(backfill_closed_by, migrations.RunPython.noop),
    ]
