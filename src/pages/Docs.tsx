import { useParams } from "react-router-dom";
import DocsIndex from "./docs/DocsIndex";
import DocsTopic from "./docs/DocsTopic";
import { DOCS_SECTIONS } from "./docs/docsContent";

export { DOCS_SECTIONS };

export default function Docs() {
  const { section, topic } = useParams();

  if (section && topic) {
    return <DocsTopic section={section} topic={topic} />;
  }

  return <DocsIndex />;
}
