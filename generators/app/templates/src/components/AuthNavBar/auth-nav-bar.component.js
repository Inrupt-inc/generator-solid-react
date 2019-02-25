import React from "react";
import { NavBar } from "@components";

import { NavBarProfile, LanguageDropdown } from "./children";

const AuthNavBar = props => {
  const { t, onLanguageSelect } = props;
  const navigation = [
    {
      id: "welcome",
      icon: "img/icon/apps.svg",
      label: t("navBar.welcome"),
      to: "/welcome"
    }
  ];
  return (
    <NavBar
      navigation={navigation}
      toolbar={[
        {
          component: () => (
            <LanguageDropdown {...props} onLanguageSelect={onLanguageSelect} />
          ),
          label: "Language",
          id: "language"
        },
        {
          component: () => <NavBarProfile {...props} />,
          label: "Profile",
          id: "profile"
        }
      ]}
    />
  );
};

export default AuthNavBar;
