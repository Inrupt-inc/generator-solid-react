import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { withAuthorization, LiveUpdate } from '@inrupt/solid-react-components';
import { AuthNavBar, Footer } from '@components';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 100vh;
`;

const Content = styled.div`
  padding-top: 60px;
  flex: 1 0 auto;
  display: flex;
  overflow-y: auto;
`;

const PrivateLayout = ({ routes, ...rest }) => (
  <Route
    {...rest}
    component={matchProps => (
      <Container>
        <LiveUpdate>
          <AuthNavBar {...matchProps} />
        </LiveUpdate>
        <Content className="contentApp">
          <Switch>
            {routes.map(route => (
              <Route key={route.id} {...route} exact />
            ))}
            <Redirect to="/404" />
          </Switch>
        </Content>
        <Footer />
      </Container>
    )}
  />
);

export default withAuthorization(PrivateLayout);
