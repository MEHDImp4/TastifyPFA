import logging

from celery import shared_task

from apps.menu.models import Plat
from apps.stock.services import InsufficientStockError, StockService

logger = logging.getLogger(__name__)


@shared_task(name='apps.stock.tasks.deduct_stock_async')
def deduct_stock_async(plat_id, quantity):
    try:
        plat = Plat.objects.get(pk=plat_id)
    except Plat.DoesNotExist:
        logger.warning(
            'Skipping stock deduction for plat %s: plat does not exist.',
            plat_id,
        )
        return {'skipped': 'plat_missing', 'plat_id': plat_id}

    try:
        StockService.deduct_ingredients_for_plat(plat, quantity)
    except InsufficientStockError as exc:
        logger.critical(
            'Async stock deduction failed for plat %s x%s: %s',
            plat_id,
            quantity,
            exc,
        )
        return {
            'deducted': False,
            'plat_id': plat_id,
            'quantity': quantity,
            'error': str(exc),
        }

    return {'deducted': True, 'plat_id': plat_id, 'quantity': quantity}
