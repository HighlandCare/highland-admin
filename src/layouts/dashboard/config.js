import ChartBarIcon from "@heroicons/react/24/solid/ChartBarIcon";

import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
import ShieldCheckIcon from "@heroicons/react/24/solid/ShieldCheckIcon";
import NewspaperIcon from "@heroicons/react/24/solid/NewspaperIcon";
import InformationCircleIcon from "@heroicons/react/24/solid/InformationCircleIcon";
import Cog6ToothIcon from "@heroicons/react/24/solid/Cog6ToothIcon";

import QuestionMarkCircleIcon from "@heroicons/react/24/solid/QuestionMarkCircleIcon";
import CurrencyDollarIcon from "@heroicons/react/24/solid/CurrencyDollarIcon";
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
    title: "Driver Earnings",
    path: "/driver-earnings",
    icon: (
      <SvgIcon fontSize="small">
        <CurrencyDollarIcon />
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
