import React, { ChangeEvent, KeyboardEvent, MouseEvent, TextareaHTMLAttributes } from "react"
import { Gutter } from "./Gutter";

namespace TextEditor {
    export interface Props {
        onChange: (text: string, selStart: number, selEnd: number) => void;
        setText: (text: string, selStart: number, selEnd: number) => void;
        id: string;
        text: string;
        tabSpaces: number;
        selStart: number;
        selEnd: number;
    }
}

namespace TextUtil {
    export function isEndLine(char: string) {
        return char === '\r' || char === '\n';
    }

    export function countLines(text: string) {
        const endls = text.match(/[\r\n]/g);
        return (endls) ? endls.length + 1 : 
            (text.length > 0) ? 1 : 0;
    }

    /**
     * Gets zero-indexed line number of index in a string.
     */
    export function lineOfIndex(text: string, index: number) {
        let count = 0;
        for (let i = 0; i < index; ++i) {
            if (isEndLine(text[i])) {
                ++count;
            }
        }

        return count;
    }

    export function indexOfLine(text: string, line: number) {
        if (line === 0) return 0;

        let count = 0;
        for (let i = 0; i < text.length; ++i) {
            if (isEndLine(text[i])) {
                ++count;
                if (count === line)
                    return i;
            }
        }

        return -1;
    }

    export function performTab(text: string, start: number, end: number, tabSize: number = 4) {
        const tab = " ".repeat(Math.max(Math.abs(tabSize), 1));
        const origStart = start;
        if (start ===  end) {
            // add tab at the cursor if no selection
            return {text: text.slice(0, start) + tab + text.slice(start), task: TabTask.OneTab, numLines: 0, untab: false};
        }

        while (start !== 0 && !isEndLine(text[start-1])) {
            --start;
        }

        const selected = text.slice(start, end);
        const numLines = countLines(selected);

        if (numLines > 1) {
            const tabbedSelection = tab + selected.replace(/[\r\n]/g, "\n" + tab);

            // add tabs at the beginning of each line that was partially or wholly selected
            return {text: text.slice(0, start) + tabbedSelection + text.slice(end), task: TabTask.MultiTab, numLines, untab: false };
        } else {
            // delete text if only on one line
            return {text: text.slice(0, origStart) + text.slice(end), task: TabTask.Splice, numLines, untab: false};
        }
    }

    // Strip start of string of white spaces
    function stripStart(text: string, count: number, start: number = 0) {
        let sliceIndex = start + count;
        for (let i = 0; i < count && i < text.length; ++i) {
            if (text[i + start] !== " ") {
                sliceIndex = i + start; 
                break;
            }
        }

        return text.slice(0, start) + text.slice(sliceIndex);
    }

    // TODO: merge this function with perform tab, using negative tabSize as the deciding factor between behaviors
    export function performUntab(text: string, start: number, end: number, tabSize: number = 4) {
        tabSize = (Math.max(Math.abs(tabSize), 1));

        while (start !== 0 && !isEndLine(text[start-1])) {
            --start;
        }

        const selected = text.slice(start, end);
        const numLines = countLines(selected);

        let untabbed: string;
        let task: TabTask;

        if (numLines > 1) {  // multiple lines
            untabbed = stripStart(selected, tabSize, 0);            

            for (let i = 0; i < untabbed.length; ++ i) {
                if (isEndLine(untabbed[i])) {
                    untabbed = stripStart(untabbed, tabSize, i + 1);
                }
            }

            task = TabTask.MultiTab;
            
        } else {
            untabbed = stripStart(selected, tabSize, 0);
            task = TabTask.OneTab;
        }

        const ret = text.slice(0, start) + untabbed + text.slice(end);
        return {text: ret, task, untab: true, numLines };
    }

    export enum TabTask {
        OneTab,
        Splice,
        MultiTab
    }

    export interface SelectedProps {
        startLine: number;
        endLine: number;
        text: string;
    }

    export function getSelected(el: HTMLTextAreaElement) {
        const text = el.value.substring(el.selectionStart, el.selectionEnd);
        const startLine = TextUtil.lineOfIndex(el.value, el.selectionStart);
        const endLine = TextUtil.lineOfIndex(el.value, el.selectionEnd);
        return {
            startLine,
            endLine,
            text
        } as SelectedProps;
    }
}

export class TextEditor extends React.Component<TextEditor.Props> {
    private mEditor: HTMLTextAreaElement; // cached ref
    private mTabbed: boolean = false;     // flag to pass between callbacks

    constructor(props: TextEditor.Props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    }

    componentDidMount(): void {
        this.props.setText(this.editor.value, this.editor.selectionStart, this.editor.selectionEnd);
    }

    handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
        this.props.onChange(event.target.value, this.editor.selectionStart, this.editor.selectionEnd);
    }

    handleClick(event: MouseEvent<HTMLTextAreaElement>) {
        this.props.onChange(this.editor.value, this.editor.selectionStart, this.editor.selectionEnd);
    }

    handleScroll(event: MouseEvent<HTMLTextAreaElement>) {
        const gutters = document.getElementsByClassName("gutter");
        if (gutters.length === 0)
            return;
        const gutter = gutters[0];

        gutter.scrollTo(0, this.editor.scrollTop);
    }

    handleKeydown(event: KeyboardEvent<HTMLTextAreaElement>) {
        switch(event.key) {
            case "Tab": {
                event.preventDefault();
    
    
                const start = this.editor.selectionStart;
                const end = this.editor.selectionEnd;
                const tabSpaces = Math.max(this.props.tabSpaces, 1);
    
                const tabbed = (event.shiftKey) ? 
                    TextUtil.performUntab(this.props.text, start, end, tabSpaces) :
                    TextUtil.performTab(this.props.text, start, end, tabSpaces);
                
                let newStart = start;
                let newEnd = end;
    
                // Reorient editor selection based on task performed
                if (tabbed.untab) {
                    switch(tabbed.task) {
                        case TextUtil.TabTask.OneTab:
                            newStart = start - tabSpaces;
                            newEnd = newStart;
                        break;
    
                        case TextUtil.TabTask.Splice:
                            // invalid
                        break;
    
                        case TextUtil.TabTask.MultiTab:
                            newStart = start - tabSpaces;
                            newEnd = end - ((tabbed.numLines) * tabSpaces);
                        break;
                    }
                } else {
                    switch(tabbed.task) {
                        case TextUtil.TabTask.OneTab:
                            newStart = start + tabSpaces;
                            newEnd = newStart;
                        break;
    
                        case TextUtil.TabTask.Splice:
                            newStart = start;
                            newEnd = newStart;
                        break;
    
                        case TextUtil.TabTask.MultiTab:
                            newStart = start + tabSpaces;
                            newEnd = end + ((tabbed.numLines) * tabSpaces);
                        break;
                    }
                }
    
    
                this.props.onChange(tabbed.text, newStart, newEnd);
                break;
            }
        }
    }

    handleSelect() {
        this.props.onChange(this.editor.value, this.editor.selectionStart, this.editor.selectionEnd);
    }

    get editor() {
        if (!this.mEditor)
            this.mEditor = document.getElementById(this.props.id) as HTMLTextAreaElement;
        return this.mEditor;
    }

    override componentDidUpdate() {
        // Set the tab correctly
        this.editor.selectionStart = this.props.selStart;
        this.editor.selectionEnd = this.props.selEnd;

    }

    get currentRow(): number {
        let row = TextUtil.lineOfIndex(this.props.text, this.props.selEnd);
        return row;
    }

    override render() {
        return (
            <div className="text-editor">
                <Gutter rowCount={TextUtil.countLines(this.props.text)} currentRow={this.currentRow}></Gutter>
                <textarea
                    id={this.props.id}
                    onKeyDown={this.handleKeydown}
                    onChange={this.handleChange}
                    onClick={this.handleClick}
                    value={this.props.text}
                    onSelect={this.handleSelect}
                    onScroll={this.handleScroll}
                    spellCheck="false">
                </textarea>
            </div>

        );
    }
}