import SheetMusicViewer from "@/Components/SheetMusicViewer";
import { Button } from "@/Components/Ui/Button";
import { Input } from "@/Components/Ui/Input";
import { Song } from "@/types/Song";
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

export default function Home() {
	const [songs, setSongs] = useState<null | Song[]>(null);
	const [selectedSong, setSelectedSong] = useState<Song | null>(null);
	const [search, setSearch] = useState("");

	async function load() {
		try {
			const dirHandle: FileSystemDirectoryHandle =
				await window.showDirectoryPicker();
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
		} catch (e) {
			console.error(e);
		}
	}

	const filteredSongs =
		search === "" ? songs : songs?.filter(s => s.name.includes(search));

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
			<main className="flex flex-col">
				{!selectedSong && (
					<Input
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="m-2"
					/>
				)}
				{songs == null && (
					<div className="flex justify-center items-center flex-1">
						<Button onClick={() => load()}>Load</Button>
					</div>
				)}
				{!selectedSong && (
					<div className="grid grid-cols-8 gap-2 flex-1 m-4">
						{filteredSongs?.map(song => (
							<Button
								key={song.url}
								onClick={() => setSelectedSong(song)}
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
