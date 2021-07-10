import React, { Component } from 'react';
import { createGlobalStyle } from 'styled-components';
import Light from './NeueHaasDisplay-XThin.ttf';
import Regular from './NeueHaasDisplay-Roman.ttf';
import Bold from './NeueHaasDisplay-Bold.ttf';
import Black from './NeueHaasDisplay-Black.woff';

export default class Fonts extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const GlobalStyle = createGlobalStyle`
      html, body {
        font-family: 'Neue Haas', sans-serif;
      }

      @font-face {
        font-family: 'Neue Haas Display Light';
        src: url(${Light}) format('truetype');
        font-weight: 100;
        font-style: normal;
      }

      @font-face {
        font-family: 'Neue Haas';
        src: url(${Regular}) format('truetype');
        font-weight: normal;
        font-style: normal;
      }

      @font-face {
        font-family: 'Neue Haas';
        src: url(${Bold}) format('truetype');
        font-weight: 700;
        font-style: normal;
      }

      @font-face {
        font-family: 'Neue Haas';
        src: url(${Black}) format('woff');
        font-weight: 900;
        font-style: normal;
      }

      .light-text {
        font-weight: 100;
      }

      .bold-text {
        font-weight: 700;
      }

      .extra-bold-text {
        font-weight: 900;
      }
    `;

    return (<GlobalStyle />)
  }
}
