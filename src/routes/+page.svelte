<script lang="ts">
	import { profile, experience, education, projects, certifications, awards, skills } from '$lib/data';
	import { onMount } from 'svelte';

	// Typing animation state
	let currentTitleIndex = $state(0);
	let displayText = $state('');
	let isDeleting = $state(false);
	let charIndex = $state(0);

	// Contact form state
	let formData = $state({ name: '', email: '', message: '' });
	let isSubmitting = $state(false);
	let submitStatus = $state<'idle' | 'success' | 'error'>('idle');
	let errorMessage = $state('');

	onMount(() => {
		const typeSpeed = 100;
		const deleteSpeed = 50;
		const pauseTime = 3000; // 3 seconds pause before deleting

		function type() {
			const currentTitle = profile.titles[currentTitleIndex];

			if (!isDeleting) {
				// Typing
				if (charIndex < currentTitle.length) {
					displayText = currentTitle.substring(0, charIndex + 1);
					charIndex++;
					setTimeout(type, typeSpeed);
				} else {
					// Pause before deleting
					setTimeout(() => {
						isDeleting = true;
						type();
					}, pauseTime);
				}
			} else {
				// Deleting
				if (charIndex > 0) {
					displayText = currentTitle.substring(0, charIndex - 1);
					charIndex--;
					setTimeout(type, deleteSpeed);
				} else {
					// Move to next title
					isDeleting = false;
					currentTitleIndex = (currentTitleIndex + 1) % profile.titles.length;
					setTimeout(type, 500);
				}
			}
		}

		type();
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;
		submitStatus = 'idle';
		errorMessage = '';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to send message');
			}

			submitStatus = 'success';
			formData = { name: '', email: '', message: '' };
			setTimeout(() => {
				submitStatus = 'idle';
			}, 5000);
		} catch (err) {
			submitStatus = 'error';
			errorMessage = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<!-- Hero Section -->
<section class="min-h-screen flex items-center justify-center px-6 pt-20">
	<div class="max-w-4xl mx-auto w-full">
		<div class="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
			<!-- Text Content -->
			<div class="flex-1">
				<div class="animate-fade-in opacity-0">
					<p class="text-[var(--color-accent)] font-medium mb-4">Hi, my name is</p>
				</div>
				<h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in opacity-0 animate-delay-100">
					{profile.name}<span class="text-[var(--color-accent)]">.</span>
				</h1>
				<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-muted)] mb-6 animate-fade-in opacity-0 animate-delay-200 h-[1.2em]">
					<span class="inline-block min-w-[1ch]">{displayText}</span><span class="typing-cursor">|</span>
				</h2>
				<p class="text-lg text-[var(--color-text-muted)] max-w-xl mb-8 animate-fade-in opacity-0 animate-delay-300">
					{profile.bio}
				</p>
				<div class="flex flex-wrap gap-4 animate-fade-in opacity-0 animate-delay-400">
					<a
						href="#contact"
						class="px-6 py-3 bg-[var(--color-accent)] text-[var(--color-background)] font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
					>
						Get in Touch
					</a>
					<a
						href="#projects"
						class="px-6 py-3 border border-[var(--color-accent)] text-[var(--color-accent)] font-medium rounded-lg hover:bg-[var(--color-accent)]/10 transition-colors"
					>
						View Projects
					</a>
				</div>
			</div>

			<!-- Profile Photo -->
			<div class="flex justify-center md:justify-end animate-fade-in opacity-0 animate-delay-200">
				<div class="relative">
					<!-- Rotating border -->
					<div class="absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--color-accent)] via-emerald-300 to-[var(--color-accent)] opacity-75 blur-sm animate-spin-slow"></div>
					<!-- Photo container -->
					<div class="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-2 border-[var(--color-accent)]/50 bg-[var(--color-background)]">
						<img
							src="/self.jpg"
							alt="Yomal Praveen"
							class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- About Section -->
<section id="about" class="py-20 px-6">
	<div class="max-w-4xl mx-auto">
		<h2 class="text-2xl font-bold mb-8 flex items-center gap-4">
			<span class="text-[var(--color-accent)]">01.</span> About
			<span class="h-px bg-[var(--color-border)] flex-1"></span>
		</h2>

		<div class="grid md:grid-cols-2 gap-12">
			<div class="space-y-4 text-[var(--color-text-muted)]">
				<p>
					I'm a Cyber Security Analyst with experience in threat detection, incident response,
					and vulnerability assessment. Currently working at Halexo Pvt Ltd as an L2 Analyst,
					where I investigate complex security incidents and enhance security protocols.
				</p>
				<p>
					I'm passionate about offensive security and regularly participate in CTF competitions.
					I've placed in multiple competitions including Medusa CTF (2nd) and HashX CTF (3rd).
				</p>
				<p>
					Currently pursuing my MSc in Cyber Security and Networking at Kingston University
					while working towards certifications like CySA+ and Microsoft SC-200.
				</p>
			</div>

			<div>
				<h3 class="text-lg font-semibold mb-4">Skills & Tools</h3>
				<div class="space-y-4">
					{#each Object.entries(skills) as [category, items]}
						<div>
							<h4 class="text-sm text-[var(--color-accent)] mb-2">{category}</h4>
							<p class="text-sm text-[var(--color-text-muted)]">{items.join(' · ')}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Experience Section -->
<section id="experience" class="py-20 px-6 bg-[var(--color-surface)]">
	<div class="max-w-4xl mx-auto">
		<h2 class="text-2xl font-bold mb-8 flex items-center gap-4">
			<span class="text-[var(--color-accent)]">02.</span> Experience
			<span class="h-px bg-[var(--color-border)] flex-1"></span>
		</h2>

		<div class="space-y-8">
			{#each experience as job}
				<div class="group">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
						<h3 class="text-lg font-semibold">
							{job.title} <span class="text-[var(--color-accent)]">@ {job.company}</span>
						</h3>
						<span class="text-sm text-[var(--color-text-muted)]">{job.period}</span>
					</div>
					<p class="text-[var(--color-text-muted)]">{job.description}</p>
				</div>
			{/each}
		</div>

		<!-- Education -->
		<h3 class="text-xl font-bold mt-16 mb-6">Education</h3>
		<div class="space-y-4">
			{#each education as edu}
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h4 class="font-semibold">{edu.degree}</h4>
						<p class="text-sm text-[var(--color-text-muted)]">{edu.institution}</p>
					</div>
					<span class="text-sm text-[var(--color-text-muted)]">{edu.period}</span>
				</div>
			{/each}
		</div>

		<!-- Certifications -->
		<h3 class="text-xl font-bold mt-16 mb-6">Certifications</h3>
		<div class="grid sm:grid-cols-2 gap-3">
			{#each certifications as cert}
				<div class="flex items-center gap-2 text-sm">
					{#if cert.status === 'completed'}
						<span class="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
					{:else}
						<span class="w-2 h-2 rounded-full border border-[var(--color-accent)]"></span>
					{/if}
					{#if cert.link}
						<a
							href={cert.link}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 group"
						>
							{cert.name}
							<svg class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</a>
					{:else}
						<span class={cert.status === 'in-progress' ? 'text-[var(--color-text-muted)]' : ''}>
							{cert.name}
							{#if cert.status === 'in-progress'}
								<span class="text-xs text-[var(--color-text-muted)]">(In Progress)</span>
							{/if}
						</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Awards -->
		<h3 class="text-xl font-bold mt-16 mb-6">CTF Achievements</h3>
		<div class="flex flex-wrap gap-4">
			{#each awards as award}
				<a
					href={award.link}
					target="_blank"
					rel="noopener noreferrer"
					class="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-accent)] transition-colors"
				>
					<span class="font-medium">{award.name}</span>
					<span class="text-[var(--color-accent)] ml-2">{award.place}</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- Projects Section -->
<section id="projects" class="py-20 px-6">
	<div class="max-w-4xl mx-auto">
		<h2 class="text-2xl font-bold mb-8 flex items-center gap-4">
			<span class="text-[var(--color-accent)]">03.</span> Projects
			<span class="h-px bg-[var(--color-border)] flex-1"></span>
		</h2>

		<div class="grid md:grid-cols-2 gap-6">
			{#each projects as project}
				<div class="group p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 transition-colors">
					<div class="flex items-start justify-between mb-4">
						<svg class="w-10 h-10 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
						{#if project.link && project.link !== '#'}
							<a href={project.link} target="_blank" rel="noopener noreferrer" class="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
							</a>
						{/if}
					</div>
					<h3 class="text-lg font-semibold mb-2 group-hover:text-[var(--color-accent)] transition-colors">
						{project.title}
					</h3>
					<p class="text-sm text-[var(--color-text-muted)] mb-4">{project.description}</p>
					<div class="flex flex-wrap gap-2">
						{#each project.tags as tag}
							<span class="text-xs px-2 py-1 rounded bg-[var(--color-background)] text-[var(--color-text-muted)]">
								{tag}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-20 px-6 bg-[var(--color-surface)]">
	<div class="max-w-4xl mx-auto">
		<h2 class="text-2xl font-bold mb-8 flex items-center gap-4">
			<span class="text-[var(--color-accent)]">04.</span> Get In Touch
			<span class="h-px bg-[var(--color-border)] flex-1"></span>
		</h2>

		<div class="grid md:grid-cols-2 gap-12">
			<!-- Contact Info -->
			<div>
				<p class="text-[var(--color-text-muted)] mb-8">
					I'm currently open to new opportunities and freelance work. Whether you have a question,
					a project idea, or just want to say hi, feel free to reach out.
				</p>

				<div class="space-y-4">
					<a
						href="mailto:{profile.email}"
						class="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						{profile.email}
					</a>
					<a
						href={profile.social.github}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						GitHub Profile
					</a>
					<a
						href={profile.social.linkedin}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
						</svg>
						LinkedIn Profile
					</a>
				</div>
			</div>

			<!-- Contact Form -->
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
						Name
					</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={formData.name}
						required
						class="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
						Email
					</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={formData.email}
						required
						class="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
					/>
				</div>

				<div>
					<label for="message" class="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
						Message
					</label>
					<textarea
						id="message"
						name="message"
						bind:value={formData.message}
						required
						rows={5}
						class="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
					></textarea>
				</div>

				{#if submitStatus === 'error'}
					<div class="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
						{errorMessage}
					</div>
				{/if}

				{#if submitStatus === 'success'}
					<div class="p-3 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/50 rounded-lg text-[var(--color-accent)] text-sm">
						Thank you for your message! I'll get back to you soon.
					</div>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting || submitStatus === 'success'}
					class="w-full py-3 px-6 bg-[var(--color-accent)] text-[var(--color-background)] font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						Sending...
					{:else if submitStatus === 'success'}
						Message Sent!
					{:else}
						Send Message
					{/if}
				</button>
			</form>
		</div>
	</div>
</section>

<style>
	.typing-cursor {
		animation: blink 1s step-end infinite;
		color: var(--color-accent);
		font-weight: 300;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	.animate-spin-slow {
		animation: spin 8s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
