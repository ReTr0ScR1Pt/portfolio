<script lang="ts">
	import './layout.css';
	import { profile } from '$lib/data';
	import { onMount } from 'svelte';

	let { children } = $props();

	const navLinks = [
		{ href: '#about', label: 'About' },
		{ href: '#experience', label: 'Experience' },
		{ href: '#projects', label: 'Projects' },
		{ href: '#contact', label: 'Contact' }
	];

	let scrolled = $state(false);
	let mobileMenuOpen = $state(false);

	function handleScroll() {
		scrolled = window.scrollY > 50;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// Animated favicon
	onMount(() => {
		const frames = 20;
		let currentFrame = 0;
		let direction = 1;

		function createFaviconSVG(scale: number, opacity: number) {
			const size = 8 + scale * 4; // Ball size varies from 8 to 12
			const glowOpacity = 0.3 + opacity * 0.4;
			return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
				<defs>
					<radialGradient id="glow" cx="50%" cy="50%" r="50%">
						<stop offset="0%" stop-color="#10b981" stop-opacity="${glowOpacity}"/>
						<stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
					</radialGradient>
				</defs>
				<circle cx="16" cy="16" r="14" fill="url(#glow)"/>
				<circle cx="16" cy="16" r="${size}" fill="#10b981"/>
				<circle cx="14" cy="14" r="${size * 0.25}" fill="#34d399" opacity="0.6"/>
			</svg>`;
		}

		function updateFavicon() {
			const progress = currentFrame / frames;
			const scale = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
			const svg = createFaviconSVG(scale, scale);
			const encoded = encodeURIComponent(svg);
			const dataUrl = `data:image/svg+xml,${encoded}`;

			let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
			if (link) {
				link.href = dataUrl;
			}

			currentFrame += direction;
			if (currentFrame >= frames || currentFrame <= 0) {
				direction *= -1;
			}
		}

		const interval = setInterval(updateFavicon, 80);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='10' fill='%2310b981'/></svg>" />
	<title>{profile.name} | {profile.titles[0]}</title>
	<meta name="description" content={profile.bio} />
	<meta property="og:title" content="{profile.name} | {profile.titles[0]}" />
	<meta property="og:description" content={profile.bio} />
	<meta property="og:type" content="website" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<svelte:window onscroll={handleScroll} />

<div class="min-h-screen">
	<!-- Navigation -->
	<nav
		class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {scrolled || mobileMenuOpen
			? 'bg-[var(--color-background)]/95 backdrop-blur-md border-b border-[var(--color-border)]'
			: ''}"
	>
		<div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
			<a href="/" class="text-lg font-semibold hover:text-[var(--color-accent)] transition-colors">
				{profile.name.split(' ')[0]}<span class="text-[var(--color-accent)]">.</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden sm:flex items-center gap-6">
				{#each navLinks as link}
					<a
						href={link.href}
						class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="sm:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="sm:hidden border-t border-[var(--color-border)] bg-[var(--color-background)]">
				<div class="px-6 py-4 flex flex-col gap-4">
					{#each navLinks as link}
						<a
							href={link.href}
							onclick={closeMobileMenu}
							class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
						>
							{link.label}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main Content -->
	<main>
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-[var(--color-border)] py-8 mt-20">
		<div class="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
			<p>&copy; {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
			<div class="flex items-center gap-4">
				<a
					href={profile.social.github}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-[var(--color-text)] transition-colors"
				>
					GitHub
				</a>
				<a
					href={profile.social.linkedin}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-[var(--color-text)] transition-colors"
				>
					LinkedIn
				</a>
			</div>
		</div>
	</footer>
</div>
