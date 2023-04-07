import SheetMusicViewer from "@/Components/SheetMusicViewer";
import { Button } from "@/Components/Ui/Button";
import { Input } from "@/Components/Ui/Input";
import { Song } from "@/types/Song";
import { get as getFromIdb, set as setIdbValue } from "idb-keyval";
import { Monitor as MonitorIcon } from "lucide-react";
import Head from "next/head";
import { useState } from "react";

declare const window: any;

function getSongName(name: string) {
	return name
		.replace(".pdf", "")
		.replace(".json", "")
		.replaceAll("_", " ")
		.replaceAll("-", " ");
}

async function getDirectoryHandle() {
	const existingHandle: FileSystemDirectoryHandle | undefined =
		await getFromIdb("directory");
	const dirHandle: FileSystemDirectoryHandle | undefined =
		await window.showDirectoryPicker({
			id: "sheet-music-viewer",
			startIn: existingHandle,
		});
	if (dirHandle) {
		await setIdbValue("directory", dirHandle);
	}
	return dirHandle;
}

export default function Home() {
	const [songs, setSongs] = useState<null | Song[]>(null);
	const [selectedSong, setSelectedSong] = useState<Song | null>(null);
	const [search, setSearch] = useState("");

	async function load() {
		try {
			const dirHandle: FileSystemDirectoryHandle | undefined =
				await getDirectoryHandle();
			if (dirHandle) {
				const foundSongs: Song[] = [];
				for await (const entry of dirHandle.values()) {
					if (entry.kind === "file") {
						const file = await entry.getFile();
						if (entry.name.includes(".json")) {
							const json = await file.text();
							const song = JSON.parse(json) as Song;
							foundSongs.push(song);
						} else if (entry.name.includes(".pdf")) {
							const existing = foundSongs.find(
								s => s.name === getSongName(entry.name)
							);
							const url = URL.createObjectURL(file);
							if (existing) {
								existing.url = url;
							} else {
								foundSongs.push({
									name: getSongName(entry.name),
									pages: [],
									url,
								});
							}
						}
					}
				}
				setSongs(foundSongs);
				if (!document.fullscreenElement != null) {
					document.body.requestFullscreen();
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	const filteredSongs =
		search === "" ? songs : songs?.filter(s => s.name.includes(search));

	function toggleFullScreen() {
		if (document.fullscreenElement != null) {
			document.exitFullscreen();
		} else {
			document.body.requestFullscreen();
		}
	}
	return (
		<>
			<Head>
				<title>{selectedSong?.name ?? "Sheet Music"}</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="flex flex-col w-screen h-screen">
				{!selectedSong && (
					<div className="m-2 flex items-center gap-2">
						<Input
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
						<Button onClick={toggleFullScreen} variant="subtle">
							<MonitorIcon />
						</Button>
					</div>
				)}
				{songs == null && (
					<div className="flex justify-center items-center flex-1">
						<Button onClick={() => load()}>Load</Button>
					</div>
				)}
				{!selectedSong && (
					<div className="flex flex-col gap-2 flex-1 m-4">
						{filteredSongs?.map(song => (
							<Button
								className="justify-start"
								key={song.url}
								onClick={() => setSelectedSong(song)}
								variant="subtle"
							>
								{song.name}
							</Button>
						))}
					</div>
				)}
				{selectedSong && (
					<SheetMusicViewer
						song={selectedSong}
						onBack={() => setSelectedSong(null)}
					/>
				)}
			</main>
		</>
	);
}
