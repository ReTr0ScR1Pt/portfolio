<script lang="ts">
	import { profile } from '$lib/data';
	import { posts } from '$lib/posts';

	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Blog | {profile.name}</title>
	<meta name="description" content="Articles on cyber security, threat detection, and incident response by {profile.name}." />
</svelte:head>

<section class="min-h-screen px-6 pt-32 pb-20">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-4xl font-bold mb-4 animate-fade-in opacity-0">
			Blog<span class="text-[var(--color-accent)]">.</span>
		</h1>
		<p class="text-[var(--color-text-muted)] mb-12 animate-fade-in opacity-0 animate-delay-100">
			Notes and write-ups on cyber security, threat detection, and incident response.
		</p>

		<div class="space-y-6 animate-fade-in opacity-0 animate-delay-200">
			{#each posts as post}
				<a
					href="/blog/{post.slug}"
					class="group block p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 transition-colors"
				>
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
						<h2 class="text-lg font-semibold group-hover:text-[var(--color-accent)] transition-colors">
							{post.title}
						</h2>
						<span class="text-sm text-[var(--color-text-muted)] shrink-0">{formatDate(post.date)}</span>
					</div>
					<p class="text-sm text-[var(--color-text-muted)] mb-4">{post.description}</p>
					<div class="flex flex-wrap gap-2">
						{#each post.tags as tag}
							<span class="text-xs px-2 py-1 rounded bg-[var(--color-background)] text-[var(--color-text-muted)]">
								{tag}
							</span>
						{/each}
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>
