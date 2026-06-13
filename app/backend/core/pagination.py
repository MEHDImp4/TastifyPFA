from rest_framework.pagination import PageNumberPagination


class OptInPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        wants_page = self.page_query_param in request.query_params
        wants_page_size = self.page_size_query_param in request.query_params
        if not wants_page and not wants_page_size:
            return None
        return super().paginate_queryset(queryset, request, view)
