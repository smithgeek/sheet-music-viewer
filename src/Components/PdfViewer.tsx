import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { useCallback, useEffect, useRef } from "react";
if (typeof document !== "undefined") {
	pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

export default function PdfViewer({
	pdf,
	page,
}: {
	pdf: PDFDocumentProxy;
	page: number;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pageRendering = useRef(false);

	const renderPage = useCallback(
		(pageNum: number) => {
			if (!pageRendering.current && pdf) {
				pageRendering.current = true;
				pdf.getPage(pageNum).then(function (page) {
					try {
						const defaultViewport = page.getViewport({ scale: 1 });
						const newScale = screen.height / defaultViewport.height;
						const viewport = page.getViewport({ scale: newScale });
						const canvas = canvasRef.current;
						if (canvas) {
							canvas.height = viewport.height;
							canvas.width = viewport.width;
							const canvasContext = canvas.getContext("2d");
							if (canvasContext) {
								page.render({
									canvasContext,
									viewport: viewport,
								});
							}
						}
					} catch (error) {
						console.error(error);
					}
					pageRendering.current = false;
				});
			}
		},
		[pdf]
	);

	useEffect(() => {
		renderPage(page);
	}, [page, renderPage]);

	return <canvas ref={canvasRef}></canvas>;
}
