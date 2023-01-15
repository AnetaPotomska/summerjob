import { useRef, useState } from "react";

interface RowProps {
  data: any[];
  children: React.ReactNode;
}

const Arrow = () => (
  <i className="fas fa-angle-right" style={{ width: "0.5rem" }}></i>
);
const ExpandedArrow = () => (
  <i className="fas fa-angle-down" style={{ width: "0.5rem" }}></i>
);

function Cell({ contents, tooltip }: { contents: any; tooltip?: string }) {
  return (
    <td className="text-truncate" title={tooltip}>
      {contents}
    </td>
  );
}

export function ExpandableRow({ data, children }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  const collapsibleContentRef = useRef<HTMLDivElement>(null);
  const computedHeight = () => {
    if (collapsibleContentRef.current) {
      return collapsibleContentRef.current.scrollHeight;
    }
    return 0;
  };

  return (
    <>
      <tr className="smj-expandable-row" onClick={toggleExpanded}>
        {data.slice(0, 1).map((field, index) => (
          <Cell
            key={index}
            contents={
              <>
                {expanded && <ExpandedArrow />}
                {!expanded && <Arrow />}
                {field}
              </>
            }
          />
        ))}
        {data.slice(1).map((field, index) => (
          <Cell
            key={index + 1}
            contents={field}
            tooltip={typeof field === "string" ? field : undefined}
          />
        ))}
      </tr>

      <tr className="smj-details-row">
        <td colSpan={data.length}>
          <div
            className="smj-row-collapsible"
            ref={collapsibleContentRef}
            style={{ maxHeight: expanded ? `${computedHeight()}px` : "0px" }}
          >
            <div className="p-2">{children}</div>
          </div>
        </td>
      </tr>
    </>
  );
}