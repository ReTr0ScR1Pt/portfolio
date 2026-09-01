<script lang="ts">
	import { profile } from '$lib/data';
	import { posts } from '$lib/posts';

	const post = posts.find((p) => p.slug === 'email-analysis')!;

	const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
</script>

<svelte:head>
	<title>{post.title} | {profile.name}</title>
	<meta name="description" content={post.description} />
	<meta property="og:title" content="{post.title} | {profile.name}" />
	<meta property="og:description" content={post.description} />
	<meta property="og:type" content="article" />
</svelte:head>

<article class="min-h-screen px-6 pt-32 pb-20">
	<div class="max-w-3xl mx-auto">
		<a
			href="/blog"
			class="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Blog
		</a>

		<h1 class="text-3xl sm:text-4xl font-bold mb-4">
			{post.title}<span class="text-[var(--color-accent)]">.</span>
		</h1>

		<div class="flex flex-wrap items-center gap-4 mb-4 text-sm text-[var(--color-text-muted)]">
			<span>{formattedDate}</span>
			<span>·</span>
			<span>{profile.name}</span>
		</div>

		<div class="flex flex-wrap gap-2 mb-12">
			{#each post.tags as tag}
				<span class="text-xs px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
					{tag}
				</span>
			{/each}
		</div>

		<!-- Write your post below. The sections are a suggested outline — replace the placeholder text with your own content. -->
		<div class="prose prose-invert prose-headings:text-[var(--color-text)] prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text)] prose-code:text-[var(--color-accent)] max-w-none">
			<p>
				Email remains the most common initial access vector, and analyzing a suspicious email
				properly is one of the core skills of a SOC analyst. In this post I'll walk through my
				process for dissecting a phishing email — from headers to indicators of compromise.
			</p>

			<h2>1. Header Analysis</h2>
			<p>
				The headers tell the real story of where an email came from. Key fields to examine
				include <code>Return-Path</code>, <code>Received</code> chains, <code>Reply-To</code>,
				and the originating IP address.
			</p>

			<h2>2. Authentication Results (SPF, DKIM, DMARC)</h2>
			<p>
				Checking <code>Authentication-Results</code> reveals whether the sending domain is
				spoofed. A failed SPF or DKIM check on a message claiming to be from a trusted brand is
				a strong signal.
			</p>

			<h2>3. Body &amp; URL Analysis</h2>
			<p>
				Hover, don't click. Extract and defang URLs, check redirect chains, and look for
				lookalike domains and urgency-driven language in the body.
			</p>

			<h2>4. Attachment Analysis</h2>
			<p>
				Hash any attachments and check them against threat intelligence sources before ever
				opening them — and only ever detonate in a sandbox.
			</p>

			<h2>5. Verdict &amp; Response</h2>
			<p>
				Pulling the indicators together: making the call, blocking the sender and IOCs,
				searching for other recipients, and documenting the incident.
			</p>
		</div>
	</div>
</article>
