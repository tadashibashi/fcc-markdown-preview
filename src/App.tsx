import React, { Dispatch } from "react"
import ReactDOM from "react-dom/client";
import { connect, Provider } from "react-redux";
import { State, Action, ActionType, store } from "./store";

import { TextEditor } from "./TextEditor";

interface AppProps {
    state: State;
    setInputText: (text: string, selStart: number, selEnd: number) => void;
    clearText: () => void;
    updateText: () => void;
}

function mapStateToProps(state: State): Partial<AppProps> {
    return {
        state
    };
}

function mapDispatcherToProps(dispatch: Dispatch<Action>): Partial<AppProps> {
    return {
        setInputText(text: string, selStart: number, selEnd: number) {
            dispatch({
                type: ActionType.SetText,
                data: { text, selStart, selEnd }
            });
        },
        clearText() {
            dispatch({
                type: ActionType.Clear
            });
        }
    };
}

class App extends React.Component<AppProps> {

    constructor(props: AppProps) {
        super(props);
        
        this.handleOnChange = this.handleOnChange.bind(this);
    }

    handleOnChange(text: string, selStart: number, selEnd: number) {
        this.props.setInputText(text, selStart, selEnd);
    }

    render() {
        console.log(this.props.state.output);
        return (
            <div id="app-container">
                <h1>Markdown Preview</h1>
                <div id="text-windows">
                    <TextEditor 
                        id="editor" 
                        onChange={this.handleOnChange} 
                        text={this.props.state.input}
                        selStart={this.props.state.selStart}
                        selEnd={this.props.state.selEnd}
                        setText={this.props.setInputText}
                        tabSpaces={4}/>
                    <div id="preview" dangerouslySetInnerHTML={{__html: this.props.state.output}}></div>
                </div>
                
            </div>
        );
    }
}

const Container = connect(mapStateToProps, mapDispatcherToProps)(App);

function AppWrapper() {
    return (
        <Provider store={store}>
            <Container></Container>
        </Provider>
    );
}

export function render() {
    const el = document.getElementById("app");
    if (!el) {
        console.error("Failed to get app element. Could not render the application!");
        return;
    }
    const root = ReactDOM.createRoot(el);
    root.render(<AppWrapper />);
}
