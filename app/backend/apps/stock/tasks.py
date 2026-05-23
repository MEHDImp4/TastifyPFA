import logging

from celery import shared_task
from apps.menu.models import Plat
from apps.stock.services import InsufficientStockError, StockService

logger = logging.getLogger(__name__)


@shared_task(name='stock.deduct_stock')
def deduct_stock_async(plat_id, quantity):
    try:
        plat = Plat.objects.get(pk=plat_id)
    except Plat.DoesNotExist:
        return {'deducted': False, 'plat_id': plat_id, 'quantity': quantity, 'reason': 'plat_not_found'}

    try:
        StockService.deduct_ingredients_for_plat(plat, quantity)
    except InsufficientStockError:
        logger.critical('Insufficient stock while deducting plat %s for quantity %s.', plat_id, quantity)
        return {'deducted': False, 'plat_id': plat_id, 'quantity': quantity}

    return {'deducted': True, 'plat_id': plat_id, 'quantity': quantity}
