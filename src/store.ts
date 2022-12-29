import { configureStore } from "@reduxjs/toolkit";
import DOMPurify from "dompurify";
import { marked } from "marked"

export interface State {
    input: string;
    output: string;

    selStart: number;
    selEnd: number;
}

export enum ActionType {
    SetText,
    Clear
}

interface ActionData {
    text: string;
    selStart: number;
    selEnd: number;
}

export interface Action {
    type: ActionType;
    data?: ActionData;
}

const initialState: State = {
    input: 
`![Markdown Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Markdown-mark.svg/1200px-Markdown-mark.svg.png)
# Markdown Preview
A simple markdown previewer built for the freeCodeCamp front-end certificate.

Live build can be found [here](https://aaronishibashi.com/portfolio/web/markdown-preview), 
and source code [here](https://github.com/tadashibashi/fcc-markdown-preview)

## Tools

- **Libraries**
    - React
    - Redux
    - Marked
    - DOMPurify

- **Preprocessors**
    - TypeScript
    - Stylus
    - Webpack

## Build

\`\`\`
npm install
npm run build
\`\`\`

The \`./dist\` directory is then ready to load in a live server

> note: for a development build watcher, use \`npm run watch\`

`,
    output: "",
    selStart: 0,
    selEnd: 0
};

function reducer(state = initialState, action: Action): State {
    switch(action.type) {
        case ActionType.SetText: {
            let data = action.data as ActionData;

            let output = DOMPurify.sanitize(marked.parse(data.text, { breaks: true }));

            return {input: data.text, output, selStart: data.selStart, selEnd: data.selEnd} as State;
        }

        case ActionType.Clear: {
            return {
                input: "",
                output: "",
                selStart: 0,
                selEnd: 0
            } as State;
        }

        default:
            return state;
    }
}

export const store = configureStore({
    reducer,
    preloadedState: initialState
});
