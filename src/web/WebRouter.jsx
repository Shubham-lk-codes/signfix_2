import React from 'react';
import WebLayout from './WebLayout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import PortfolioPage from './pages/PortfolioPage';
import ThreeDLettersPage from './pages/ThreeDLettersPage';
import CorporateSignagePage from './pages/CorporateSignagePage';
import IndoorSignagePage from './pages/IndoorSignagePage';
import LargeSignBoardsPage from './pages/LargeSignBoardsPage';
import LedSignRepairPage from './pages/LedSignRepairPage';
import MallSignagePage from './pages/MallSignagePage';
import NamePlatesPage from './pages/NamePlatesPage';
import OutdoorSignagePage from './pages/OutdoorSignagePage';
import PanIndiaSupplyPage from './pages/PanIndiaSupplyPage';
import RestaurantSignagePage from './pages/RestaurantSignagePage';
import RetailSignagePage from './pages/RetailSignagePage';
import ShowroomSignagePage from './pages/ShowroomSignagePage';
import SignBoardRepairPage from './pages/SignBoardRepairPage';
import SignInstallationPage from './pages/SignInstallationPage';
import SignMaintenancePage from './pages/SignMaintenancePage';
import SignRestorationPage from './pages/SignRestorationPage';
import SignageFabricationPage from './pages/SignageFabricationPage';

export default function WebRouter({ path }) {
  let PageComponent = HomePage;

  switch (path) {
    case '/about':
      PageComponent = AboutPage;
      break;
    case '/contact':
      PageComponent = ContactPage;
      break;
    case '/faq':
      PageComponent = FaqPage;
      break;
    case '/portfolio':
      PageComponent = PortfolioPage;
      break;
    case '/3d-letters':
      PageComponent = ThreeDLettersPage;
      break;
    case '/corporate-signage':
      PageComponent = CorporateSignagePage;
      break;
    case '/indoor-signage':
      PageComponent = IndoorSignagePage;
      break;
    case '/large-sign-boards':
      PageComponent = LargeSignBoardsPage;
      break;
    case '/led-sign-repair':
      PageComponent = LedSignRepairPage;
      break;
    case '/mall-signage':
      PageComponent = MallSignagePage;
      break;
    case '/name-plates':
      PageComponent = NamePlatesPage;
      break;
    case '/outdoor-signage':
      PageComponent = OutdoorSignagePage;
      break;
    case '/pan-india-supply':
      PageComponent = PanIndiaSupplyPage;
      break;
    case '/restaurant-signage':
      PageComponent = RestaurantSignagePage;
      break;
    case '/retail-signage':
      PageComponent = RetailSignagePage;
      break;
    case '/showroom-signage':
      PageComponent = ShowroomSignagePage;
      break;
    case '/sign-board-repair':
      PageComponent = SignBoardRepairPage;
      break;
    case '/sign-installation':
      PageComponent = SignInstallationPage;
      break;
    case '/sign-maintenance':
      PageComponent = SignMaintenancePage;
      break;
    case '/sign-restoration':
      PageComponent = SignRestorationPage;
      break;
    case '/signage-fabrication':
      PageComponent = SignageFabricationPage;
      break;
    default:
      PageComponent = HomePage;
      break;
  }

  return (
    <WebLayout>
      <PageComponent />
    </WebLayout>
  );
}
