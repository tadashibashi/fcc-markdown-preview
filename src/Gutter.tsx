import React from "react"

interface GutterProps {
    rowCount: number;
    currentRow: number;
}

export class Gutter extends React.Component<GutterProps> {
    constructor(props: GutterProps) {
        super(props);
    }

    render() {
        
        const rows = [];
        for (let i = 0; i < this.props.rowCount; ++i) {
            rows.push(
                <li
                    key={"gutter-row-" + i} 
                    className={"gutter-row" + (i === this.props.currentRow ? " current" : "")}>
                        {i + 1}
                </li>);
        }

        return (
            <div className="gutter">
                <ul>
                    {rows}
                </ul>
            </div>
        )

    }
}