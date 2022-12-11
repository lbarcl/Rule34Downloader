<script lang="ts">
	import { onMount } from 'svelte';
	let path = 'C:/';

	let tags: Array<String> = [];
	let tag = '';
	let page = -1;

	let connceted = false;
	let downloading = false;
	let ws: WebSocket;

	let downloadedPages = 0;
	let downloadedPosts = 0;

	onMount(() => {
		ws = new WebSocket('ws://localhost:9865');
		ws.addEventListener('open', () => {
			connceted = true;
		});

		ws.addEventListener('message', ({ data }) => {
			var msg = JSON.parse(data);
			if (msg.eventType == 'downloading') {
				downloadedPages = msg.downloadedPages;
				downloadedPosts = msg.downloadedPosts;
			} else if (msg.eventType == 'downloaded') {
				downloadedPages = msg.downloadedPages;
				downloadedPosts = msg.downloadedPosts;
				downloading = false;
			}
		});
	});

	function download() {
		downloading = true;
		ws.send(
			JSON.stringify({
				eventType: 'download',
				pages: page,
				tags: tags.join('+'),
				path,
			}),
		);
	}

	async function selectPath() {
		path = await window.electron.selectFolder();
	}

	function parseTag() {
		if (tag[tag.length - 1] == ' ') {
			var temp = tag.replaceAll(' ', '');
			if (temp == '') return;
			tags.push(temp);
			tags = tags;
			tag = '';
		}
	}

	function arrayRemove(arr: Array<String>, value: String) {
		return arr.filter(function (ele) {
			return ele != value;
		});
	}
</script>

<div class="container">
	<div class="box">
		{#if connceted && !downloading}
			<label for="tags">Enter your tags</label>
			<input
				class="input mt-2"
				bind:value={tag}
				on:input={parseTag}
				type="text"
				id="tags"
				placeholder="tags separeted by space"
			/>
			<div class="is-flex tag-holder">
				{#each tags as t}
					<button
						class="tag is-warning mt-2 mb-1 mx-1"
						on:click={() => {
							tags = arrayRemove(tags, t);
						}}
					>
						{t}
					</button>
				{/each}
			</div>
			<label for="page-count">Page count</label>
			<h8 class="has-text-grey">-1 means all of the avaliable pages</h8>
			<input
				id="page-count"
				class="input mt-2"
				type="number"
				bind:value={page}
				placeholder="-1 means all of the avaliable pages"
			/>
			<div class="is-flex">
				<button class="button is-link mt-2" on:click={selectPath}>Sellect path</button>
				<input class="input mt-2 ml-2" type="text" readonly bind:value={path} />
			</div>
			<div class="is-flex">
				<button class="button is-primary mt-2" on:click={download}>Download</button>
				<div />
			</div>
		{:else if !connceted}
			<h1>Waiting for connection</h1>
		{:else if connceted && downloading}
			<p>downloaded Pages: {downloadedPages} | downloaded Posts: {downloadedPosts}</p>
		{/if}
	</div>
</div>

<style>
	div.container {
		margin-top: 2%;
		width: 60%;
		justify-content: center;
		justify-items: center;
	}

	div.tag-holder {
		overflow: scroll;
	}

	button.tag {
		border-color: transparent;
	}
</style>
