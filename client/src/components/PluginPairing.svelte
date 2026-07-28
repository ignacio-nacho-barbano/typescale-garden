<!--
	"Connect the Figma plugin" — the web-app half of the pairing flow.

	The plugin cannot run Auth0's browser login (Figma's sandbox has no redirect
	surface), and handing it a raw Auth0 access token would give it a credential valid
	against every other API scope. So the user, who IS signed in here, mints a short
	code and types it into the plugin once; the plugin swaps it for its own read-only
	token. See server/src/db/plugin-auth.ts for the other half.

	The code is a credential: it is shown, never persisted client-side, and the
	countdown exists so a stale code left on screen reads as expired rather than broken.
-->
<script lang="ts">
	import { onDestroy } from "svelte";
	import { copyToClipboard } from "../functions";
	import { fetch } from "../stores/fetch";
	import { showNotification } from "../stores/notifications";
	import Button from "./Button.svelte";
	import Modal from "./Modal.svelte";

	export let open = false;

	interface PluginConnection {
		id: string;
		label: string | null;
		createdAt: string;
		lastUsedAt: string | null;
	}

	let displayCode = "";
	let expiresAt = "";
	let secondsLeft = 0;
	let generating = false;
	let connections: PluginConnection[] = [];
	let loadingConnections = false;

	// One interval for the whole component, cleared on destroy — a modal that can be
	// opened and closed repeatedly must not accumulate timers.
	const ticker = setInterval(() => {
		if (!expiresAt) return;

		secondsLeft = Math.max(0, Math.round((Date.parse(expiresAt) - Date.now()) / 1000));

		// Drop the code from memory the moment it stops being usable, so a modal left
		// open does not keep offering a dead one to copy.
		if (secondsLeft === 0) {
			displayCode = "";
			expiresAt = "";
		}
	}, 1000);

	onDestroy(() => clearInterval(ticker));

	async function loadConnections() {
		loadingConnections = true;
		try {
			const { data } = await $fetch.get<{ connections: PluginConnection[] }>("/plugin/connections");
			connections = data.connections;
		} catch (error) {
			console.error(error);
			showNotification("Could not load your connected plugins.");
		}
		loadingConnections = false;
	}

	async function generate() {
		generating = true;
		try {
			const { data } = await $fetch.post<{ displayCode: string; expiresAt: string }>(
				"/plugin/pairing-codes"
			);
			displayCode = data.displayCode;
			expiresAt = data.expiresAt;
			secondsLeft = Math.max(0, Math.round((Date.parse(expiresAt) - Date.now()) / 1000));
		} catch (error) {
			console.error(error);
			showNotification("Could not create a pairing code, please try again.");
		}
		generating = false;
	}

	async function disconnect(id: string) {
		try {
			const { data } = await $fetch.delete<{ connections: PluginConnection[] }>(
				`/plugin/connections/${id}`
			);
			connections = data.connections;
			showNotification("That plugin was disconnected.");
		} catch (error) {
			console.error(error);
			showNotification("Could not disconnect that plugin.");
		}
	}

	// Only fetch when the modal is actually opened, and refresh on each open so a
	// pairing completed in Figma shows up without a page reload.
	$: if (open) loadConnections();

	const formatDate = (value: string) => new Date(value).toLocaleDateString();
	$: countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
</script>

<Modal bind:open title="Connect the Figma plugin">
	<div class="pairing">
		<ol class="steps">
			<li class="body-2">Generate a pairing code below.</li>
			<li class="body-2">
				In Figma, run <b>Typescale Garden Import Tool</b> and paste the code when it asks.
			</li>
			<li class="body-2">The plugin can then read your saved scales — it can never change them.</li>
		</ol>

		{#if displayCode}
			<div class="code-box">
				<p class="code notranslate">{displayCode}</p>
				<div class="code-actions">
					<Button
						size="s"
						type="primary"
						leadIcon="ContentCopy"
						on:click={() => copyToClipboard(displayCode, "Pairing code")}>Copy</Button
					>
					<p class="tooltip">Expires in {countdown}</p>
				</div>
			</div>
		{:else}
			<Button type="primary" disabled={generating} on:click={generate}>
				{generating ? "Generating…" : "Generate a pairing code"}
			</Button>
		{/if}

		<section class="connections">
			<h2 class="title-5">Connected plugins</h2>
			{#if loadingConnections && !connections.length}
				<p class="tooltip">…Loading</p>
			{:else if !connections.length}
				<p class="tooltip">No Figma plugin is connected to your account yet.</p>
			{:else}
				<ul>
					{#each connections as connection (connection.id)}
						<li>
							<div>
								<b class="body-2">{connection.label || "Figma plugin"}</b>
								<span class="tooltip">
									paired {formatDate(connection.createdAt)} · last used {connection.lastUsedAt
										? formatDate(connection.lastUsedAt)
										: "never"}
								</span>
							</div>
							<Button
								size="s"
								alt="disconnect this plugin"
								leadIcon="LinkOff"
								on:click={() => disconnect(connection.id)}>Disconnect</Button
							>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</Modal>

<style lang="scss">
	.pairing {
		display: flex;
		flex-direction: column;
		gap: $s5;
		overflow-y: auto;
	}

	ol.steps {
		display: flex;
		flex-direction: column;
		gap: $s3;
		padding-left: $s5;
	}

	.code-box {
		display: flex;
		flex-direction: column;
		gap: $s3;
		align-items: center;
		padding: $s4;
		border-radius: $s4;
		border: $lw solid $c-accent;
	}

	p.code {
		font-family: monospace;
		font-size: $s6;
		letter-spacing: 0.2em;
		user-select: all;
	}

	.code-actions {
		display: flex;
		align-items: center;
		gap: $s4;
	}

	.connections {
		display: flex;
		flex-direction: column;
		gap: $s3;

		ul {
			display: flex;
			flex-direction: column;
			gap: $s3;
			list-style: none;
		}

		li {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: $s4;

			div {
				display: flex;
				flex-direction: column;
			}
		}
	}
</style>
