import { ArrowRight, Mail, Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { useExperiences } from "@/services/experience";
import { useProjects } from "@/services/projects";
import { useSkills } from "@/services/skills";

// Site owner contact details. Update these to the real phone / inbox.
const NAME = "Mohammad Amin Samadi";
const SHORT_NAME = "Mohammad A. Samadi";
const PHONE = "(555) 000-0000";
const PHONE_HREF = "tel:+15550000000";
const EMAIL = "masamadi.sfr@email.com";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

function Landing() {
  return (
    <div className="bg-background text-foreground relative min-h-[100dvh]">
      <Nav />
      <main className="mx-auto max-w-2xl px-5">
        <Hero />
        <About />
        <ExperienceSection />
        <SkillsSection />
        <WorkSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

/* --- Motion helper ---------------------------------------------------------- */

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-6 text-xs font-medium tracking-[0.18em] uppercase">
      {children}
    </p>
  );
}

/* --- Nav -------------------------------------------------------------------- */

function Nav() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
        <a href="#top" className="text-sm font-semibold tracking-tight">
          {SHORT_NAME}
        </a>
        <nav className="hidden items-center gap-6 sm:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            render={<a href={PHONE_HREF} aria-label="Call" />}
          >
            <Phone className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            render={<a href={`mailto:${EMAIL}`} aria-label="Email" />}
          >
            <Mail className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

/* --- Hero ------------------------------------------------------------------- */

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section id="top" className="relative pt-16 pb-20">
      <WavyBackground />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <img
          src="https://cdn.samadihomerenovation.com/projects/IMG_0874.jpg"
          alt=""
          className="bg-secondary text-foreground ring-border flex size-24 items-center justify-center rounded-full object-cover text-lg font-semibold ring-1 md:size-32 lg:size-40"
        />

        <div className="mt-6">
          <span className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Available for work · Florida
          </span>
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Remodeling &amp; handyman with 20+ years on the tools.
        </h1>

        <p className="text-muted-foreground mt-5 max-w-xl leading-relaxed">
          Hi, I&apos;m {NAME}. For over two decades I&apos;ve remodeled kitchens
          and baths, built decks, and handled the repairs that keep Florida
          homes running. Reliable, clean, and finished on schedule, every job.
        </p>

        <div className="mt-8 flex items-center gap-6">
          <Button
            size="lg"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            render={<a href="#contact" />}
          >
            Hire me
          </Button>
          <a
            href="#experience"
            className="text-sm font-medium underline underline-offset-4"
          >
            View experience
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function WavyBackground() {
  return (
    <svg
      aria-hidden
      className="text-border pointer-events-none absolute inset-x-0 -top-16 -z-10 h-72 w-full opacity-70"
      preserveAspectRatio="none"
      viewBox="0 0 800 300"
      fill="none"
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <path
          key={i}
          d={`M0 ${40 + i * 32} C 160 ${20 + i * 32}, 320 ${60 + i * 32}, 480 ${
            40 + i * 32
          } S 720 ${20 + i * 32}, 800 ${40 + i * 32}`}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/* --- About ------------------------------------------------------------------ */

function About() {
  return (
    <Section id="about">
      <Reveal>
        <Eyebrow>About</Eyebrow>
        <div className="text-foreground/90 space-y-4 leading-relaxed">
          <p>
            I work directly with homeowners and contractors across Florida, no
            middlemen, no surprises. I show up when I say I will, keep the site
            clean, and don&apos;t call a job done until it&apos;s right.
          </p>
          <p>
            Whether it&apos;s a full kitchen gut or a long list of small fixes,
            I bring the same care and craftsmanship I&apos;ve built over 20
            years. Licensed, insured, and easy to work with.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

/* --- Experience ------------------------------------------------------------- */

function ExperienceSection() {
  const { data: rows, isLoading } = useExperiences();

  return (
    <Section id="experience">
      <Reveal>
        <Eyebrow>Experience</Eyebrow>
      </Reveal>
      <div className="space-y-10">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !rows?.length ? (
          <p className="text-muted-foreground text-sm">
            No experience added yet.
          </p>
        ) : (
          rows.map((row, i) => (
            <Reveal key={row.id} delay={i * 0.04}>
              <div className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:gap-6">
                <p className="text-muted-foreground pt-0.5 text-sm">
                  {row.period}
                </p>
                <div>
                  <h3 className="font-semibold tracking-tight">{row.role}</h3>
                  {(row.company || row.location) && (
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {[row.company, row.location].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {row.description && (
                    <p className="text-foreground/80 mt-2 text-sm leading-relaxed">
                      {row.description}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          ))
        )}
      </div>
    </Section>
  );
}

/* --- What I do -------------------------------------------------------------- */

function SkillsSection() {
  const { data: rows, isLoading } = useSkills();

  return (
    <Section>
      <Reveal>
        <Eyebrow>What I do</Eyebrow>
      </Reveal>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : !rows?.length ? (
        <p className="text-muted-foreground text-sm">No services added yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row, i) => (
            <Reveal key={row.id} delay={i * 0.03}>
              <div className="border-border flex items-center gap-3 rounded-lg border px-4 py-3">
                <span className="bg-foreground size-2 shrink-0 rounded-[2px]" />
                <span className="text-sm font-medium">{row.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}

/* --- Selected work ---------------------------------------------------------- */

function WorkSection() {
  const { data: rows, isLoading } = useProjects();

  return (
    <Section id="work">
      <Reveal>
        <Eyebrow>Selected work</Eyebrow>
      </Reveal>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : !rows?.length ? (
        <p className="text-muted-foreground text-sm">No projects added yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {rows.map((row, i) => (
            <Reveal key={row.id} delay={i * 0.04}>
              <figure>
                <div className="bg-secondary aspect-[4/3] overflow-hidden rounded-xl">
                  {row.cover_image_url && (
                    <img
                      src={row.cover_image_url}
                      alt={row.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <figcaption className="mt-3 text-sm font-semibold">
                  {row.title}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}

/* --- Contact ---------------------------------------------------------------- */

function ContactSection() {
  return (
    <Section id="contact">
      <Reveal>
        <Eyebrow>Contact</Eyebrow>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Looking to hire? Let&apos;s talk.
        </h2>
        <p className="text-muted-foreground mt-4 max-w-md leading-relaxed">
          Reach out anytime, happy to walk through my experience or come take a
          look at a project.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={PHONE_HREF}
            className="border-border hover:border-foreground/40 block rounded-lg border px-4 py-3 transition-colors"
          >
            <span className="text-muted-foreground block text-xs tracking-[0.18em] uppercase">
              Phone
            </span>
            <span className="mt-1 block font-medium">{PHONE}</span>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="border-border hover:border-foreground/40 block rounded-lg border px-4 py-3 transition-colors"
          >
            <span className="text-muted-foreground block text-xs tracking-[0.18em] uppercase">
              Email
            </span>
            <span className="mt-1 block font-medium">{EMAIL}</span>
          </a>
        </div>

        <div className="mt-8">
          <Button size="lg" render={<a href={`mailto:${EMAIL}`} />}>
            Email me
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}

/* --- Footer ----------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-border/60 mt-10 border-t">
      <div className="text-muted-foreground mx-auto max-w-2xl px-5 py-8 text-xs">
        <p>© 2025 {NAME} · Remodeling &amp; Handyman · Florida</p>
      </div>
    </footer>
  );
}

/* --- Section wrapper -------------------------------------------------------- */

function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("border-border/60 scroll-mt-20 border-t py-16", className)}
    >
      {children}
    </section>
  );
}

export default Landing;
