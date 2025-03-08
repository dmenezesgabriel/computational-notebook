import { useCallback, useEffect, useRef, useState } from "react";
import { sharedContext } from "../utils/code-execution";

interface IframeOutputProps {
  code: string;
  id: number;
  result: string;
}

export function IframeOutput({ code, id, result }: IframeOutputProps) {
  const [iframeHeight, setIframeHeight] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updateIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      const height = iframe.contentWindow.document.documentElement.scrollHeight;
      setIframeHeight(height);
    }
  }, []);

  const getIframeSharedContext = () => {
    const iframe = iframeRef.current;
    if (iframe) {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframeWindow.sharedContext = sharedContext;
      }
    }
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const document = iframe.contentDocument;
      if (document) {
        document.body.innerHTML = "";
        const rootDiv = document.createElement("div");
        rootDiv.setAttribute("id", "root");
        document.body.appendChild(rootDiv);
        const script = document.createElement("script");
        script.type = "module";
        script.textContent = result;
        document.body.appendChild(script);
        getIframeSharedContext();

        const resizeObserver = new ResizeObserver(() => {
          updateIframeHeight();
        });
        resizeObserver.observe(document.body);

        setTimeout(updateIframeHeight, 100);
      }
    }
  }, [result, updateIframeHeight]);

  useEffect(() => {
    setIframeKey((prevKey) => prevKey + 1);
  }, [code]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", updateIframeHeight);
      return () => {
        iframe.removeEventListener("load", updateIframeHeight);
      };
    }
  }, [updateIframeHeight]);

  return (
    <iframe
      key={iframeKey}
      id={`jsx-iframe-${id}`}
      title={`JSX Output ${id}`}
      style={{ width: "100%", height: `${iframeHeight}px`, border: "none" }}
      ref={iframeRef}
    />
  );
}
