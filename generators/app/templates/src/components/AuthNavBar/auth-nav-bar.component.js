import React from "react";
import { NavBar } from "@components";

import { NavBarProfile } from "./children";
import { LanguageDropdown } from "@util-components";

const AuthNavBar = props => {
  const { t } = props;
  const navigation = [
    {
      id: "welcome",
      icon: "img/icon/apps.svg",
      label: t("navBar.welcome"),
      to: "/welcome"
    },
    {
      id: "profile",
      icon: "img/people.svg",
      label: t("navBar.profile"),
      to: "/profile"
    }
  ];
  return (
    <NavBar
      navigation={navigation}
      sticky={true}
      toolbar={[
        {
          component: () => <LanguageDropdown {...props} className={'accordion'} />,
          id: "language"
        },
        {
          component: () => <NavBarProfile {...props} />,
          id: "profile"
        }
      ]}
    />
  );
};

export default AuthNavBar;
