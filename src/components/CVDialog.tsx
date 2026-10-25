"use client";
import { ArrowUpRight, X } from "lucide-react";
import { PROFILE } from "@/content/profile";
export default function CVDialog({
  onClose,
  dialogRef,
}: {
  onClose: () => void;
  dialogRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="info-panel cv-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button close-button"
          autoFocus
          onClick={onClose}
          aria-label="Close CV"
        >
          <X size={20} />
        </button>
        <span className="info-kicker">Room 04 / Curriculum vitae</span>
        <header className="cv-intro">
          <div>
            <h2 id="cv-title">{PROFILE.name}</h2>
            <p className="cv-headline">{PROFILE.headline}</p>
            <p>{PROFILE.summary}</p>
          </div>
          <div className="cv-company">
            <span>Current chapter</span>
            <strong>{PROFILE.company}</strong>
            <p>{PROFILE.currentRole}</p>
            <a
              className="contact-link"
              href={PROFILE.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Let’s build something
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        </header>
        <div className="cv-columns">
          <div>
            <h3>Experience</h3>
            <ol className="cv-timeline">
              {PROFILE.experience.map((job) => (
                <li key={job.company}>
                  <div className="cv-period">{job.period}</div>
                  <div>
                    <h4>{job.company}</h4>
                    <p className="cv-role">{job.role}</p>
                    <p>{job.summary}</p>
                    <p className="cv-technologies">{job.technologies}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="cv-sidebar">
            <section>
              <h3>Tools & technologies</h3>
              <ul className="cv-skills">
                {PROFILE.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Education</h3>
              <span className="cv-period">{PROFILE.education.period}</span>
              <h4>{PROFILE.education.degree}</h4>
              <p>
                {PROFILE.education.faculty}
                <br />
                {PROFILE.education.institution}
              </p>
            </section>
            <section>
              <h3>Languages</h3>
              {PROFILE.languages.map((language) => (
                <p key={language.name}>
                  <strong>{language.name}</strong>
                  <br />
                  {language.level}
                </p>
              ))}
            </section>
            <section>
              <h3>Knowledge & open source</h3>
              {PROFILE.links.map((link) => (
                <a
                  key={link.url}
                  className="cv-external-link"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ))}
            </section>
          </aside>
        </div>
        <footer className="cv-footer">
          <a
            className="cv-external-link"
            href={PROFILE.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Full CV at FOLLOWTHEPATTERN
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <span>{PROFILE.fullName}</span>
        </footer>
      </section>
    </div>
  );
}
