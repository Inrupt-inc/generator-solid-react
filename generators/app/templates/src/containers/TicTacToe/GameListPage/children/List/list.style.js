import styled from 'styled-components';

export const Wrapper = styled.div`
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  text-align: left;
  min-height: 200px;
  transition: height 1s ease-in-out; 
  & > h2 {
    margin: 0;
    padding: 0 0 12px 0;
  }
  & > form {
    & .input-wrap > label {
      width: 100%;
      font-size: 0.9em;
    }
    & > span {
      font-weight: 700;
    }

`;

export const ListWrapper = styled.div`
  max-height: 350px;
  overflow: initial;
`;

export const GameListContainers = styled.div`
  width: 100%;
`;
