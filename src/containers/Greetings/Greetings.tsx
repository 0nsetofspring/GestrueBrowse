import { Component } from 'react';
import icon from '../../assets/img/icon-128.png';

interface State {
  name: string;
}

class GreetingComponent extends Component<{}, State> {
  override state: State = {
    name: 'dev',
  };

  override render() {
    return (
      <div>
        <p>Hello, {this.state.name}!</p>
        <img src={icon} alt="extension icon" />
      </div>
    );
  }
}

export default GreetingComponent; 