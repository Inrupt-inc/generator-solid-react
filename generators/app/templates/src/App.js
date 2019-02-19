import React, { Component, Fragment, Suspense } from "react";
import { ToastProvider } from "react-toast-notifications";
import { ToasterNotification } from "@util-components";

import Routes from "./routes";
import { ThemeProvider } from "styled-components";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";

import theme from "./utils/theme";
import "normalize.css";
import "./index.css";
import "@inrupt/inrupt-atomic-style-guide";

library.add(fas);
class App extends Component {
  render() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ThemeProvider theme={theme}>
          <ToastProvider
            components={{ Toast: ToasterNotification }}
            placement="top-center"
            autoDismiss={true}
            autoDismissTimeout={3000}
          >
            <Fragment>
              <Routes />
            </Fragment>
          </ToastProvider>
        </ThemeProvider>
      </Suspense>
    );
  }
}

export default App;
