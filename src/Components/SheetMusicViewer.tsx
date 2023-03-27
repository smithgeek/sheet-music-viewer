import { useHotKeys } from "@/hooks/useHotKey";
import useLongPress from "@/lib/onLongPress";
import { Song } from "@/types/Song";
import { TrashIcon } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { useEffect, useRef, useState } from "react";
import { useImmer } from "use-immer";
import PdfViewer from "./PdfViewer";
import { Button } from "./Ui/Button";
import { Dialog, DialogContent } from "./Ui/Dialog";
import { Input } from "./Ui/Input";
import { ScrollArea } from "./Ui/ScrollArea";
if (typeof document !== "undefined") {
	pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

export default function SheetMusicViewer({
	song,
	onBack,
}: {
	song: Song;
	onBack: () => void;
}) {
	const pdfLoaded = useRef(false);
	const [pdfRef, setPdfRef] = useState<PDFDocumentProxy | null>(null);
	const [pages, setPages] = useImmer(song.pages);
	const [currentPage, setCurrentPage] = useState(1);
	const [showDialog, setShowDialog] = useState<
		"hide" | "show" | "pageEditor"
	>("hide");
	const showTwoPages = screen.width > 1300;
	const jsonHandle = useRef<FileSystemFileHandle | null>(null);

	const nextPage = () =>
		pdfRef &&
		currentPage < pages.length - (showTwoPages ? 1 : 0) &&
		setCurrentPage(currentPage + 1);

	const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

	useHotKeys(
		e => {
			if (
				(e.key === "ArrowRight" ||
					e.key === "PageDown" ||
					e.key === "ArrowDown") &&
				e.type === "keydown" &&
				currentPage < pages.length
			) {
				nextPage();
			} else if (
				(e.key === "ArrowLeft" ||
					e.key === "PageUp" ||
					e.key === "ArrowUp") &&
				e.type === "keydown" &&
				currentPage > 0
			) {
				prevPage();
			}
		},
		"pdfPageViewer",
		[currentPage, setCurrentPage, nextPage, prevPage]
	);

	useEffect(() => {
		if (pdfRef == null && !pdfLoaded.current) {
			pdfLoaded.current = true;
			const loadingTask = pdfjsLib.getDocument(song.url);
			loadingTask.promise.then(
				loadedPdf => {
					setPdfRef(loadedPdf);
					if (pages.length === 0) {
						const pageList = [];
						for (let i = 0; i < loadedPdf.numPages; ++i) {
							pageList.push(i + 1);
						}
						setPages(pageList);
					}
				},
				function (reason) {
					console.error(reason);
				}
			);
		}
	}, [pages.length, pdfRef, setPages, setPdfRef, song.url]);
	const onShowContextMenu = useLongPress(() => setShowDialog("show"));

	async function save() {
		try {
			if (jsonHandle.current == null) {
				jsonHandle.current = await showSaveFilePicker({
					suggestedName: `${song.name}.json`,
				});
			}
			const writable = await jsonHandle.current.createWritable();
			await writable.write({
				data: JSON.stringify({
					...song,
					pages,
				}),
				type: "write",
			});
			await writable.close();
		} catch (e) {
			console.error(e);
		}
	}

	return (
		<>
			<div
				style={{
					flex: 1,
					height: "100vh",
					display: "flex",
					justifyContent: "center",
				}}
			>
				{pdfRef && (
					<>
						<PdfViewer
							pdf={pdfRef}
							page={pages[currentPage - 1]}
							numberOfPages={showTwoPages ? 2 : 1}
						/>
						{showTwoPages && (
							<PdfViewer
								pdf={pdfRef}
								page={pages[currentPage]}
								numberOfPages={2}
							/>
						)}
					</>
				)}
				<Dialog
					open={showDialog != "hide"}
					onOpenChange={open => {
						if (!open) {
							setShowDialog("hide");
						}
					}}
				>
					<DialogContent onClick={e => e.stopPropagation()}>
						<div className="flex gap-2 flex-col mt-4">
							{showDialog === "show" && (
								<>
									<Button
										onClick={() => {
											onBack();
											pdfRef?.destroy();
										}}
									>
										Back
									</Button>
									<Button
										onClick={() => {
											setShowDialog("pageEditor");
										}}
									>
										EditPages
									</Button>
								</>
							)}
							{showDialog === "pageEditor" && (
								<ScrollArea className="h-[70vh] pr-4">
									<div className="flex flex-col gap-2">
										{pages.map((p, index) => (
											<div
												key={`${index}-${p}`}
												className="flex gap-2 items-center"
											>
												<Input
													value={p}
													type="number"
													min={1}
													max={pdfRef?.numPages ?? 1}
													onChange={e =>
														setPages(pgs => {
															const value =
																parseInt(
																	e.target
																		.value
																);
															if (
																value > 0 &&
																value <=
																	(pdfRef?.numPages ??
																		0)
															) {
																pgs[index] =
																	value;
															}
														})
													}
												/>
												<Button
													variant="destructive"
													onClick={() => {
														setPages(pgs => {
															pgs.splice(
																index,
																1
															);
														});
													}}
												>
													<TrashIcon />
												</Button>
											</div>
										))}
									</div>
									<div className="flex gap-2 items-center mt-2">
										<Button
											className="flex-1"
											onClick={() => {
												setPages(pgs => {
													pgs.push(
														pdfRef?.numPages ?? 1
													);
												});
											}}
										>
											Add
										</Button>
										<Button
											className="flex-1"
											onClick={() => {
												save();
												setShowDialog("show");
											}}
										>
											Save
										</Button>
									</div>
								</ScrollArea>
							)}
						</div>
					</DialogContent>
				</Dialog>
			</div>
			<div className="absolute top-0 bottom-0 right-0 left-0 flex">
				<div
					className="flex-1"
					{...onShowContextMenu}
					onClick={() => prevPage()}
				></div>
				<div
					className="flex-1"
					{...onShowContextMenu}
					onClick={() => nextPage()}
				></div>
			</div>
		</>
	);
}
