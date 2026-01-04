import logging



class CorrelationIdFilter(logging.Filter):
    """Logging filter that injects a correlation_id into the log record.
    The ID is retrieved from the LogCorrelationMiddleware.
    """

    def filter(self, record):
        from core.middleware import get_correlation_id
        record.correlation_id = get_correlation_id()
        return True
