import ChartBarIcon from "@heroicons/react/24/solid/ChartBarIcon";
import MapIcon from "@heroicons/react/24/solid/MapIcon";

import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
import ShieldCheckIcon from "@heroicons/react/24/solid/ShieldCheckIcon";
import NewspaperIcon from "@heroicons/react/24/solid/NewspaperIcon";
import InformationCircleIcon from "@heroicons/react/24/solid/InformationCircleIcon";
import Cog6ToothIcon from "@heroicons/react/24/solid/Cog6ToothIcon";

import QuestionMarkCircleIcon from "@heroicons/react/24/solid/QuestionMarkCircleIcon";
import CurrencyDollarIcon from "@heroicons/react/24/solid/CurrencyDollarIcon";
import ReceiptPercentIcon from "@heroicons/react/24/solid/ReceiptPercentIcon";
import ClockIcon from "@heroicons/react/24/solid/ClockIcon";
import ExclamationTriangleIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";
import BuildingStorefrontIcon from "@heroicons/react/24/solid/BuildingStorefrontIcon";
import { SvgIcon } from "@mui/material";
export const items = [
  {
    title: "Dashboard",
    path: "/",
    icon: (
      <SvgIcon fontSize="small">
        <ChartBarIcon />
      </SvgIcon>
    ),
  },
  {
    title: "Live Operations",
    path: "/live-operations",
    icon: (
      <SvgIcon fontSize="small">
        <MapIcon />
      </SvgIcon>
    ),
  },

  {
    title: "Users Manangement",
    path: "/users",
    icon: (
      <SvgIcon fontSize="small">
        <UsersIcon />
      </SvgIcon>
    ),
  },
  {
    title: "Driver Manangement",
    path: "/chaperone",
    icon: (
      <SvgIcon fontSize="small">
        <Cog6ToothIcon />
      </SvgIcon>
    ),
  },
  {
    title: "Restaurant Management",
    path: "/restaurants",
    icon: (
      <SvgIcon fontSize="small">
        <BuildingStorefrontIcon />
      </SvgIcon>
    ),
  },
  {
    title: "Driver Earnings",
    path: "/driver-earnings",
    icon: (
      <SvgIcon fontSize="small">
        <CurrencyDollarIcon />
      </SvgIcon>
    ),
  },
  {
    title: "Commission & Fare",
    path: "/commission",
    icon: (
      <SvgIcon fontSize="small">
        <ReceiptPercentIcon />
      </SvgIcon>
    ),
    children: [
      {
        title: "Transportation",
        path: "/commission?category=transportation",
      },
    ],
  },
  {
    title: "Ride History",
    path: "/ride-history",
    icon: (
      <SvgIcon fontSize="small">
        <ClockIcon />
      </SvgIcon>
    ),
  },
  // {
  //   title: "Waiting Adjustments",
  //   path: "/ride-adjustments",
  //   icon: (
  //     <SvgIcon fontSize="small">
  //       <ClockIcon />
  //     </SvgIcon>
  //   ),
  // },
  {
    title: "Disputes",
    path: "/disputes",
    icon: (
      <SvgIcon fontSize="small">
        <ExclamationTriangleIcon />
      </SvgIcon>
    ),
  },

  {
    title: "About",
    path: "/about",
    icon: (
      <SvgIcon fontSize="small">
        <InformationCircleIcon />
      </SvgIcon>
    ),
  },
  {
    title: "Terms & Condition",
    path: "/terms",
    icon: (
      <SvgIcon fontSize="small">
        <NewspaperIcon />
      </SvgIcon>
    ),
  },
  {
    title: "Privacy Policy",
    path: "/policy",
    icon: (
      <SvgIcon fontSize="small">
        <ShieldCheckIcon />
      </SvgIcon>
    ),
  },
  {
    title: "FAQs",
    path: "/faq",
    icon: (
      <SvgIcon fontSize="small">
        <QuestionMarkCircleIcon />
      </SvgIcon>
    ),
  },
];
