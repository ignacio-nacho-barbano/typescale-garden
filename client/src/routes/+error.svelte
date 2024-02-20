<script lang="ts">
	import { page } from "$app/stores";
	import { logError } from "../services/errorLogger";

	if ($page.error) {
		logError($page.error?.message);
	}
</script>

<section>
	<h1>{$page.error?.message}</h1>
</section>
