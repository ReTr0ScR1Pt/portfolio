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

		<div class="prose prose-invert prose-headings:text-[var(--color-text)] prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text)] prose-code:text-[var(--color-accent)] max-w-none">
			<p>
				Phishing triage is a daily part of my job. Someone reports a suspicious email, a ticket
				lands in the queue, and I have a few minutes to decide whether it gets purged from every
				mailbox in the company or handed back with a note saying it's fine. After a few hundred
				of these, the process settles into a routine. This post is that routine written down.
			</p>
			<p>
				Two rules before anything else, because they matter more than any technique below. Never
				click the link and never open the attachment. All of the analysis here happens on headers,
				hashes and sandboxes, not on the live payload. And every indicator in this post is
				defanged: <code>hxxps://</code> instead of <code>https://</code>, and
				<code>evil[.]com</code> instead of the clickable version. Copy that habit. A live URL
				pasted into a ticket becomes a clickable link for whoever reads it next. And every
				brand, domain and address in the examples here is made up.
			</p>

			<h2>Reading the headers</h2>
			<p>
				The body of an email is what the sender wants you to see. The headers are what the mail
				servers wrote down while passing it along, and servers are worse liars than people. Every
				client can show them: Gmail calls it Show original, Outlook calls it View message source.
				That raw text is where the analysis starts.
			</p>
			<p>
				<strong>From</strong> proves nothing. It's a text field the sender fills in, the same way
				you can write any name you like on the back of an envelope. Every spoofed email has a
				convincing From line. That's the whole point of spoofing.
			</p>
			<p>
				<strong>Return-Path</strong> is more honest. During the SMTP handshake the sending server
				declares an address for bounces, called the envelope sender, and your receiving server
				writes it into the message on delivery. The reader never sees this field, so attackers
				often don't bother making it pretty. When From says <code>service@acmepay.com</code> and
				Return-Path says <code>x9k2@bounce.secure-notify[.]top</code>, the mail is telling on
				itself. One caveat from real triage: bulk senders like SendGrid and Mailchimp legitimately
				use their own bounce domains, so treat a mismatch as a lead, not a conviction.
			</p>
			<p>
				<strong>Reply-To</strong> decides where your reply actually goes. The classic business
				email compromise pattern is a director's name in From and a free Gmail address in
				Reply-To, so the conversation quietly moves into the attacker's mailbox. Newsletters and
				CRM platforms use Reply-To legitimately, which is why I look at the pair: an executive
				display name plus a freemail reply address is a strong signal on its own.
			</p>
			<p>
				<strong>Received</strong> headers are the travel log. Every server that handles the
				message adds one to the top, so you read them bottom to top. Here is the part nobody
				tells beginners: the sender controls everything below the moment the message reached your
				infrastructure, and attackers do insert fake Received lines to look respectable. The only
				hops you can trust are the ones your own servers wrote, and the connecting IP recorded at
				that handoff is the honest answer to where the email really came from.
			</p>
			<p>
				<strong>Message-ID</strong> is a unique tag stamped by the sending system, and the part
				after the @ normally matches the sending infrastructure. Mail claiming to be from AcmePay
				with a Message-ID minted on <code>srv2.secure-notify[.]top</code> has some explaining to
				do. It's forgeable, so it stays supporting evidence, never the verdict.
			</p>
			<p>
				<strong>Authentication-Results</strong> is where your own gateway records the SPF, DKIM
				and DMARC verdicts. Note the wording: your own gateway. Attackers sometimes pre-insert a
				fake copy of this header full of reassuring pass results, which is exactly why gateways
				strip inbound copies that claim to be theirs. Trust the one your infrastructure stamped
				and ignore any others.
			</p>
			<p>Here's what a bad day looks like in seven lines:</p>
			<pre><code>Authentication-Results: spf=pass (sender IP is 203.0.113.11)
  smtp.mailfrom=bounce.secure-notify.top; dkim=none;
  dmarc=fail header.from=acmepay.com
From: "AcmePay Support" &lt;service@acmepay.com&gt;
Reply-To: &lt;billing.desk.verify@gmail.com&gt;
Return-Path: &lt;x9k2@bounce.secure-notify.top&gt;
Message-ID: &lt;20260901071542.9A3F1B@srv2.secure-notify.top&gt;</code></pre>
			<p>
				Four problems in one glance: SPF passed, but for the attacker's own bounce domain, not
				AcmePay. DMARC failed against the domain the reader actually sees. Replies go to a Gmail
				address. And the Message-ID was minted on the attacker's server. Any one of these is
				worth a closer look. All four together is a verdict.
			</p>

			<h2>SPF, DKIM and DMARC, without the acronym soup</h2>
			<p>
				These three verdicts sit in every Authentication-Results header and confuse people
				endlessly, so here is the version I give non-technical colleagues.
			</p>
			<p>
				<strong>SPF is a guest list.</strong> A domain publishes the list of servers allowed
				to send mail on its behalf. The list lives in DNS, the internet's public directory, so
				anyone can look it up. When a message arrives, the
				receiving server checks whether the server that delivered it is on the list. On the list,
				pass. Not on the list, fail. The trap: SPF checks the Return-Path domain, not the From
				address a human reads. That's how the AcmePay fake above earned its <code>spf=pass</code>.
				The attacker's own domain vouched for the attacker's own server, which is technically
				true and completely meaningless.
			</p>
			<p>A real SPF record is one line of DNS:</p>
			<pre><code>v=spf1 include:_spf.google.com ~all</code></pre>
			<p>
				Read it as "Google's servers may send for me, and everything else gets a soft no". That
				squiggle at the end matters more than you'd think.
			</p>
			<p>
				<strong>The <code>~all</code> versus <code>-all</code> question.</strong> The record
				ends with a symbol that tells receivers what to do about every server that isn't on the
				list. There are four options:
			</p>
			<table>
				<thead>
					<tr>
						<th>Qualifier</th>
						<th>Result</th>
						<th>What the receiver does</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>+</code></td>
						<td>pass</td>
						<td>Server is authorized</td>
					</tr>
					<tr>
						<td><code>?</code></td>
						<td>neutral</td>
						<td>Domain takes no position, rare in practice</td>
					</tr>
					<tr>
						<td><code>~</code></td>
						<td>softfail</td>
						<td>"Probably not authorized." Accept, but hold it against the message in spam scoring</td>
					</tr>
					<tr>
						<td><code>-</code></td>
						<td>fail</td>
						<td>"Not authorized." Receivers may refuse the message outright</td>
					</tr>
				</tbody>
			</table>
			<p>
				So <code>~all</code> is a soft no and <code>-all</code> is a hard no. You would expect
				everyone to run the hard no, and yet most domains use <code>~all</code>. The reason is
				forwarding. A forwarded message arrives from the forwarding server's address, which
				the original domain never listed, and a strict <code>-all</code> would get real mail
				rejected. Domains soften the SPF answer instead and let DMARC, which I'll get to in a
				moment, make the final call.
			</p>
			<p>
				<strong>DKIM is a tamper seal.</strong> The sending server stamps each message with a
				seal only it can produce, and publishes the pattern for checking that seal where any
				receiving server can look it up. The seal covers the important headers and the body, so
				if anything changes in transit, the seal breaks. For the technical readers: the seal is
				a signature made with a private key, and the public key sits in DNS at
				<code>&lt;selector&gt;._domainkey.&lt;domain&gt;</code>. Two things DKIM does not prove:
				that the mail is safe, or that the visible From is real. An attacker can seal flawlessly
				with their own domain. <code>dkim=pass</code> only means "this domain signed it and
				nobody has edited it since".
			</p>
			<p>
				<strong>DMARC ties the two together.</strong> It's a policy the domain owner publishes,
				and it reads like a standing order: "if a message claims to be from us in the From
				header, then SPF or DKIM must pass for our domain, not somebody else's, and here is what
				to do when neither does." The options are <code>p=none</code> (deliver it, just report
				it), <code>p=quarantine</code> (spam
				folder) and <code>p=reject</code> (refuse it). DMARC is the only one of the three that
				looks at the From address a human actually sees, which makes <code>dmarc=fail</code> the
				single most damning line you'll find in a header.
			</p>
			<p>
				Now the uncomfortable part: all three can pass on a phish. A compromised mailbox sends
				through real infrastructure with real keys, and a lookalike domain registered
				yesterday carries its own perfectly valid SPF, DKIM and DMARC. A display name costs nothing.
				Authentication verifies the envelope, not the intent, and I regularly mark emails as
				malicious that pass every check on this page.
			</p>

			<h2>The easy way to read headers</h2>
			<p>
				You don't have to eyeball raw headers every time. Copy them into the
				<a href="https://mxtoolbox.com/EmailHeaders.aspx" target="_blank" rel="noopener noreferrer">MxToolbox Email Header Analyzer</a>
				and it lays out every relay hop with timing, then pulls the SPF, DKIM and DMARC results
				into a table you can read in ten seconds. It's the tool I point new analysts at first,
				and the quick second opinion I still use myself.
			</p>
			<p>
				Two alternatives worth knowing:
				<a href="https://toolbox.googleapps.com/apps/messageheader/" target="_blank" rel="noopener noreferrer">Google's Messageheader</a>
				draws a clean hop-by-hop view of where delivery slowed down, and
				<a href="https://mha.azurewebsites.net/" target="_blank" rel="noopener noreferrer">Microsoft's Message Header Analyzer</a>
				is the best of the three at decoding the antispam headers Microsoft 365 stuffs into every
				message.
			</p>
			<p>
				One warning applies to all of them: headers carry your internal hostnames, IPs and the
				recipient's address. Trim anything sensitive before pasting into a third-party site.
				These tools need the headers only, never the body.
			</p>

			<h2>The body and the links</h2>
			<p>
				Headers come first because they're objective, but the body is where you can feel the con.
				It's the same handful of levers in ticket after ticket. A generic greeting, "Dear
				Customer", from a company that bills you by name. Manufactured urgency: a 24-hour
				deadline, a suspended account, a missed parcel. And a request no legitimate company makes
				over email. Nobody real asks for your password or MFA code. Nobody real asks to be paid
				in gift cards.
			</p>
			<p>
				Links get the closest look. The text of a link and its destination are completely
				independent, so a link reading <code>acmepay.com/verify</code> can point anywhere. Hover
				on desktop, long-press on mobile, and then read the actual domain from the end, right to
				left. There's a diagram of this trick in the next section, because it fools more people
				than any other.
			</p>
			<p>
				Shorteners and open redirects are the same idea one layer deeper: the chain starts on a
				reputable domain and ends somewhere ugly, so judge the final destination, never the first
				hop. <a href="https://urlscan.io/" target="_blank" rel="noopener noreferrer">urlscan.io</a>
				will follow the chain and screenshot the landing page without you ever touching it. Set
				the scan visibility to unlisted for anything work-related. Public scans are searchable by
				anyone, including the attacker, who may be watching for their own URLs. For decoding,
				extracting and defanging in bulk,
				<a href="https://gchq.github.io/CyberChef/" target="_blank" rel="noopener noreferrer">CyberChef</a>
				runs entirely in your browser and uploads nothing.
			</p>
			<p>
				QR codes are the same trick in image form. Mail filters have only recently learned to
				decode them and still miss plenty, and the scan moves the click to a phone outside your
				company's controls.
			</p>

			<h2>Attachments: hash first, open never</h2>
			<p>
				The order matters. Hash the file first, <code>Get-FileHash</code> on Windows or
				<code>sha256sum</code> on Linux, then search that hash on
				<a href="https://www.virustotal.com/" target="_blank" rel="noopener noreferrer">VirusTotal</a>.
				A hash search sends nothing. Uploading is different: submitted files are shared with AV
				vendors and downloadable by paying customers, so uploading a company invoice is a small
				data breach you performed on yourself, and it can tip off an attacker watching for their
				sample. If the hash is unknown and I need to see behavior, the file goes to a sandbox
				like <a href="https://any.run/" target="_blank" rel="noopener noreferrer">ANY.RUN</a>,
				never to my own machine. Keep in mind that free sandbox tiers make submissions public
				too. Same rule as urlscan.
			</p>
			<p>
				Extensions that make me sit up straighter: <code>.html</code> and <code>.htm</code>,
				which are either a fake login page delivered as a file or HTML smuggling, where script in
				the attachment assembles the real payload in the browser so the gateway only ever scanned
				harmless-looking HTML. Then <code>.iso</code> and <code>.img</code> disk images,
				<code>.lnk</code> shortcuts inside ZIPs, the macro formats <code>.docm</code> and
				<code>.xlsm</code>, and the old classic double extension, <code>invoice.pdf.exe</code>,
				with Windows helpfully hiding the second half.
			</p>
			<p>
				And a clean VirusTotal result proves only that the file isn't already known to be
				malicious. Fresh payloads start the day at zero detections.
			</p>

			<h2>Phishing vs a normal email, side by side</h2>
			<p>
				Everything above condenses into one principle: legitimate email is consistent. The
				sender's domain, the greeting, the tone, where the links go and what the message asks you
				to do all agree with each other. Phishing always breaks somewhere, because the sender
				isn't who the mail claims to be.
			</p>

			<div class="overflow-x-auto my-8">
				<svg viewBox="0 0 760 380" class="min-w-[680px] w-full" role="img" aria-label="Side by side comparison of a phishing email and a legitimate email with six annotated differences">
					<text x="14" y="18" class="svg-t svg-red" font-size="14" font-weight="600">Phishing</text>
					<text x="396" y="18" class="svg-t svg-green" font-size="14" font-weight="600">Legitimate</text>

					<!-- Phish card -->
					<rect x="8" y="28" width="362" height="336" rx="8" fill="var(--color-surface)" stroke="#ef4444" stroke-opacity="0.45" />
					<text x="26" y="56" class="svg-t" font-size="13">From: AcmePay Support</text>
					<text x="26" y="74" class="svg-mono svg-red" font-size="12">&lt;service@secure-notify.top&gt;</text>
					<text x="26" y="98" class="svg-t" font-size="13">Subject: <tspan class="svg-red">URGENT:</tspan> account will be closed</text>
					<line x1="22" y1="112" x2="356" y2="112" stroke="var(--color-border)" />
					<text x="26" y="136" class="svg-t" font-size="13">Dear Customer,</text>
					<text x="26" y="160" class="svg-m" font-size="12.5">We detected unusual activity on your</text>
					<text x="26" y="176" class="svg-m" font-size="12.5">account. Verify your identity <tspan class="svg-red">within 24</tspan></text>
					<text x="26" y="192" class="svg-m" font-size="12.5"><tspan class="svg-red">hours</tspan> or it will be permanently closed.</text>
					<text x="26" y="220" class="svg-link" font-size="12.5" text-decoration="underline">https://www.acmepay.com/verify</text>
					<text x="26" y="240" class="svg-mono svg-red" font-size="11">really goes to: account-verify.net</text>
					<rect x="24" y="254" width="126" height="26" rx="6" fill="none" stroke="#ef4444" stroke-opacity="0.6" />
					<text x="34" y="271" class="svg-t" font-size="12">invoice.html</text>
					<text x="26" y="308" class="svg-m" font-size="12">AcmePay Security Team</text>

					<!-- Phish callout numbers -->
					<g font-size="11" font-weight="600">
						<circle cx="346" cy="64" r="10" fill="#ef4444" /><text x="346" y="68" text-anchor="middle" fill="#fff">1</text>
						<circle cx="346" cy="94" r="10" fill="#ef4444" /><text x="346" y="98" text-anchor="middle" fill="#fff">2</text>
						<circle cx="346" cy="132" r="10" fill="#ef4444" /><text x="346" y="136" text-anchor="middle" fill="#fff">3</text>
						<circle cx="346" cy="174" r="10" fill="#ef4444" /><text x="346" y="178" text-anchor="middle" fill="#fff">4</text>
						<circle cx="346" cy="228" r="10" fill="#ef4444" /><text x="346" y="232" text-anchor="middle" fill="#fff">5</text>
						<circle cx="346" cy="267" r="10" fill="#ef4444" /><text x="346" y="271" text-anchor="middle" fill="#fff">6</text>
					</g>

					<!-- Legit card -->
					<rect x="390" y="28" width="362" height="336" rx="8" fill="var(--color-surface)" stroke="#10b981" stroke-opacity="0.45" />
					<text x="408" y="56" class="svg-t" font-size="13">From: AcmePay</text>
					<text x="408" y="74" class="svg-mono svg-m" font-size="12">&lt;service@acmepay.com&gt;</text>
					<text x="408" y="98" class="svg-t" font-size="13">Subject: Your September statement</text>
					<line x1="404" y1="112" x2="738" y2="112" stroke="var(--color-border)" />
					<text x="408" y="136" class="svg-t" font-size="13">Hello Yomal,</text>
					<text x="408" y="160" class="svg-m" font-size="12.5">Your September statement is now</text>
					<text x="408" y="176" class="svg-m" font-size="12.5">available in your account overview.</text>
					<text x="408" y="192" class="svg-m" font-size="12.5">No action is needed.</text>
					<text x="408" y="220" class="svg-link" font-size="12.5" text-decoration="underline">https://www.acmepay.com/statements</text>
					<text x="408" y="240" class="svg-mono svg-m" font-size="11">goes to: acmepay.com</text>
					<text x="408" y="271" class="svg-t" font-size="12">Anna Perera</text>
					<text x="408" y="288" class="svg-m" font-size="11">AcmePay Customer Service</text>
					<text x="408" y="308" class="svg-m" font-size="11">help.acmepay.com</text>

					<!-- Legit checkmarks -->
					<g stroke="#10b981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="728" cy="64" r="10" stroke-opacity="0.6" /><path d="M723 64 l3.5 3.5 6 -7" />
						<circle cx="728" cy="94" r="10" stroke-opacity="0.6" /><path d="M723 94 l3.5 3.5 6 -7" />
						<circle cx="728" cy="132" r="10" stroke-opacity="0.6" /><path d="M723 132 l3.5 3.5 6 -7" />
						<circle cx="728" cy="174" r="10" stroke-opacity="0.6" /><path d="M723 174 l3.5 3.5 6 -7" />
						<circle cx="728" cy="228" r="10" stroke-opacity="0.6" /><path d="M723 228 l3.5 3.5 6 -7" />
						<circle cx="728" cy="284" r="10" stroke-opacity="0.6" /><path d="M723 284 l3.5 3.5 6 -7" />
					</g>
				</svg>
			</div>

			<ol>
				<li>The display name says AcmePay. The address is on a domain AcmePay has never heard of.</li>
				<li>Panic in the subject line. Real statements don't shout.</li>
				<li>A generic greeting from a company that knows your name.</li>
				<li>A deadline and a threat, there to make you act before you think.</li>
				<li>The link text and its real destination disagree.</li>
				<li>An attachment nobody asked for, in a risky format.</li>
			</ol>

			<p>
				Look closely at the domains themselves, because lookalikes are better than most people
				think. A 1 swapped in for a lowercase l. <code>acrnepay[.]com</code>, where r and n sit
				close enough together to read as m. Cyrillic letters that render identically to Latin
				ones. And cousin domains like <code>acmepay-security-alerts[.]com</code>, which
				technically impersonate nothing: registered normally, carrying their own valid SPF, DKIM
				and DMARC, passing every authentication check while never touching AcmePay's actual
				domain. And anything to the left of a registered domain is a subdomain, a prefix the
				owner can name however they like, which is how acmepay.com ends up decorating an
				attacker's address. This is why reading from the end is the habit worth building:
			</p>

			<div class="overflow-x-auto my-8">
				<svg viewBox="0 0 760 190" class="min-w-[640px] w-full" role="img" aria-label="Anatomy of a lookalike web address showing that the real site name is the part just before the first slash">
					<text x="482" y="26" text-anchor="middle" class="svg-m" font-size="12">read from the end</text>
					<line x1="620" y1="38" x2="360" y2="38" stroke="var(--color-text-muted)" stroke-width="1.5" />
					<polygon points="348,38 362,32 362,44" fill="var(--color-text-muted)" />

					<text x="110" y="82" class="svg-mono" font-size="20">
						<tspan class="svg-m">hxxps://</tspan><tspan class="svg-t">acmepay.com.</tspan><tspan class="svg-red" font-weight="700">account-verify.net</tspan><tspan class="svg-m">/login</tspan>
					</text>

					<line x1="208" y1="98" x2="346" y2="98" stroke="var(--color-text-muted)" stroke-width="1.5" />
					<text x="277" y="122" text-anchor="middle" class="svg-m" font-size="13">just a subdomain,</text>
					<text x="277" y="140" text-anchor="middle" class="svg-m" font-size="13">named to look like the brand</text>

					<line x1="352" y1="98" x2="562" y2="98" stroke="#ef4444" stroke-width="2" />
					<text x="457" y="122" text-anchor="middle" class="svg-red" font-size="13" font-weight="600">the site you are actually on,</text>
					<text x="457" y="140" text-anchor="middle" class="svg-red" font-size="13" font-weight="600">registered by the attacker</text>
				</svg>
			</div>

			<p>
				One more, since most email is read on phones now: mobile clients usually show only the
				display name and hide the address entirely. On a phone, "AcmePay Support" is all anyone
				sees. The real address, <code>service@secure-notify[.]top</code>, is one tap away, and
				almost nobody makes that tap.
			</p>

			<h2>Making the call, and what happens after</h2>
			<p>
				The ticket leads with the verdict: phishing, spearphishing, legitimate, or occasionally
				inconclusive. Evidence goes in order of strength. Authentication and header findings
				first, then infrastructure (a domain registered nine days ago on a hosting provider that
				shows up in half our tickets), then the payload, then the wording of the body. What the
				email says is the weakest evidence. What the servers recorded is the strongest.
			</p>
			<p>
				The indicators go into a table, defanged. This campaign ran two lures, the spoofed
				AcmePay header above and the lookalike sender from the diagram, so both end up in the
				same table:
			</p>
			<table>
				<thead>
					<tr>
						<th>Type</th>
						<th>Indicator</th>
						<th>Context</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Domain</td>
						<td><code>bounce.secure-notify[.]top</code></td>
						<td>Return-Path / SPF domain</td>
					</tr>
					<tr>
						<td>IP</td>
						<td><code>203.0.113[.]11</code></td>
						<td>Delivering server</td>
					</tr>
					<tr>
						<td>URL</td>
						<td><code>hxxps://acmepay.com.account-verify[.]net/login</code></td>
						<td>Credential harvesting page</td>
					</tr>
					<tr>
						<td>Email</td>
						<td><code>billing.desk.verify@gmail[.]com</code></td>
						<td>Reply-To</td>
					</tr>
					<tr>
						<td>SHA-256</td>
						<td><code>a1b2c3...&nbsp;(attachment)</code></td>
						<td>invoice.html</td>
					</tr>
				</tbody>
			</table>
			<p>
				One reported email is rarely one email, and this is where triage turns into analysis. I
				pivot in the SIEM (Stellar Cyber, in my case) on the sender domain, the source IP, the
				subject line and the attachment hash. Who else received this campaign, and did anyone
				click? The campaign is purged from every mailbox, the indicators blocked at the gateway,
				and anyone who clicked gets a credential reset and a conversation. The
				person who reported it gets a thank you, because reporting is the behavior you want more
				of.
			</p>

			<h2>The checklist</h2>
			<p>The whole post in one box, in the order I actually work:</p>
			<ol>
				<li>Get the raw email as a .eml file. Click nothing.</li>
				<li>From vs Return-Path vs Reply-To: do the domains agree?</li>
				<li>Received chain, bottom to top: which IP handed it to your infrastructure?</li>
				<li>Authentication-Results: SPF, DKIM, and above all DMARC against the From domain.</li>
				<li>Short on time? Paste the headers into MxToolbox.</li>
				<li>Links: real destination, read right to left, unwrap shorteners.</li>
				<li>Attachments: SHA-256, search VirusTotal, sandbox if unknown. Never open.</li>
				<li>Weigh it: headers beat infrastructure, infrastructure beats payload, payload beats prose.</li>
				<li>Write the verdict, defang the IOCs, close the ticket.</li>
				<li>Pivot: find every other recipient, purge, block, reset whoever clicked.</li>
			</ol>
			<p>
				Most of this is learnable in a week of triage. The discipline of never clicking is the
				part you keep forever.
			</p>
		</div>
	</div>
</article>

<style>
	.svg-t {
		font-family: var(--font-sans);
		fill: var(--color-text);
	}
	.svg-m {
		font-family: var(--font-sans);
		fill: var(--color-text-muted);
	}
	.svg-red {
		fill: #ef4444;
	}
	.svg-green {
		fill: #10b981;
	}
	.svg-link {
		font-family: var(--font-sans);
		fill: #60a5fa;
	}
	.svg-mono {
		font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
	}
</style>
