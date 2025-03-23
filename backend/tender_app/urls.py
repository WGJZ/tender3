from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import TenderViewSet, BidViewSet, UserRegistrationView, login, BidConfirmationViewSet, get_server_time, PublicWinnerView, TenderHistoryView, company_profile

router = DefaultRouter()
router.register(r'tenders', TenderViewSet)
router.register(r'bids', BidViewSet)
router.register(r'bid-confirmations', BidConfirmationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', login, name='login'),
    path('server-time/', get_server_time, name='server-time'),
    path('public/tenders/<int:tender_id>/winner/', PublicWinnerView.as_view(), name='public-winner-view'),
    path('tenders/<int:tender_id>/history/', TenderHistoryView.as_view(), name='tender-history'),
    path('companies/profile/', company_profile, name='company-profile'),
]

# URL Patterns now include:
# - /api/tenders/ - List all tenders
# - /api/tenders/<id>/ - Retrieve, update, delete a tender
# - /api/tenders/<id>/bids/ - List bids for a tender
# - /api/tenders/<id>/history/ - Get tender history
# - /api/tenders/search/ - Search and filter tenders
# - /api/bids/ - List all bids
# - /api/bids/<id>/ - Retrieve a bid
# - /api/bids/my_bids/ - List bids for current user
# - /api/bids/<id>/select_winner/ - Select a winning bid
# - /api/bid-confirmations/ - List bid confirmations
# - /api/bid-confirmations/my_confirmations/ - List confirmations for current user 