'use client';

import { forwardRef, useMemo, useState } from 'react';

export type SiteInformation = {
  instagram?: string | null;
  email?: string | null;
  phone?: string | null;
  about?: string | null;
  clientList?: string[] | null;
};

type SiteInfoProps = {
  information?: SiteInformation | null;
  isMobile?: boolean;
  placement?: 'fixed' | 'inline';
  className?: string;
  staggerRevealedIndices?: Set<number> | null;
  staggerHiddenIndices?: Set<number> | null;
  isStaggerMeasuring?: boolean;
};

function getSectionVisibilityClassName(
  index: number,
  staggerRevealedIndices: Set<number> | null | undefined,
  staggerHiddenIndices: Set<number> | null | undefined,
  isStaggerMeasuring: boolean,
) {
  const classes: string[] = [];
  const staggerRevealActive = staggerRevealedIndices !== null && staggerRevealedIndices !== undefined;

  if (isStaggerMeasuring) {
    classes.push('project-item--load-measuring');
  }

  if (staggerRevealActive && !staggerRevealedIndices.has(index)) {
    classes.push('project-item--hidden');
  }

  if (staggerHiddenIndices?.has(index)) {
    classes.push('project-item--transition-hidden');
  }

  return classes.join(' ');
}

export const SiteInfo = forwardRef<HTMLDivElement, SiteInfoProps>(function SiteInfo(
  {
    information,
    isMobile = false,
    placement = 'fixed',
    className,
    staggerRevealedIndices = null,
    staggerHiddenIndices = null,
    isStaggerMeasuring = false,
  },
  ref,
) {
  const [expanded, setExpanded] = useState(false);

  const instagram = information?.instagram?.trim();
  const email = information?.email?.trim();
  const phone = information?.phone?.trim();
  const about = information?.about?.trim();
  const clients = information?.clientList?.filter(Boolean) ?? [];

  const hasContact = Boolean(instagram || email || phone);
  const hasAbout = Boolean(about);
  const hasClients = clients.length > 0;
  const isInlineMobile = isMobile && placement === 'inline';
  const showDetails = isInlineMobile || isMobile || expanded;

  const name = isInlineMobile ? (
    <span className="site-info__name project-item__title text-primary">Federico Gherardi</span>
  ) : (
    <span className="site-info__name text-primary">
      {isMobile ? (
        'Federico Gherardi'
      ) : (
        <>
          F<span className="site-info__name-rest">ederico</span>{' '}
          G<span className="site-info__name-rest">herardi</span>
        </>
      )}
    </span>
  );

  const inlineSections = useMemo(() => {
    if (!isInlineMobile) {
      return [];
    }

    const sections = [
      {
        key: 'abc',
        className: 'site-info__header project-item__content',
        content: (
          <>
            <span className="site-info__indicator project-item__indicator text-secondary">ABC</span>
            {name}
          </>
        ),
      },
    ];

    if (showDetails && hasContact) {
      sections.push({
        key: 'contact',
        className: 'site-info__section project-item__content',
        content: (
          <>
            <span className="site-info__indicator project-item__indicator text-secondary">A</span>
            <div className="site-info__section-content">
              {instagram ? <p className="text-primary">{instagram}</p> : null}
              {email ? <p className="text-primary">{email}</p> : null}
              {phone ? <p className="text-primary">{phone}</p> : null}
            </div>
          </>
        ),
      });
    }

    if (showDetails && hasAbout) {
      sections.push({
        key: 'about',
        className: 'site-info__section project-item__content',
        content: (
          <>
            <span className="site-info__indicator project-item__indicator text-secondary">B</span>
            <p className="site-info__about text-primary">{about}</p>
          </>
        ),
      });
    }

    if (showDetails && hasClients) {
      sections.push({
        key: 'clients',
        className: 'site-info__section project-item__content',
        content: (
          <>
            <span className="site-info__indicator project-item__indicator text-secondary">C</span>
            <ul className="site-info__clients">
              {clients.map((client) => (
                <li key={client} className="text-primary">
                  {client}
                </li>
              ))}
            </ul>
          </>
        ),
      });
    }

    return sections;
  }, [
    about,
    clients,
    email,
    hasAbout,
    hasClients,
    hasContact,
    instagram,
    isInlineMobile,
    name,
    phone,
    showDetails,
  ]);

  const sectionClassName = (index: number, baseClassName: string) =>
    `${baseClassName} ${getSectionVisibilityClassName(
      index,
      staggerRevealedIndices,
      staggerHiddenIndices,
      isStaggerMeasuring,
    )}`.trim();

  return (
    <div
      ref={ref}
      className={`site-info ${expanded ? 'site-info--expanded' : ''} ${isMobile ? 'site-info--mobile' : ''} ${isInlineMobile ? 'site-info--inline' : ''} ${className ?? ''}`.trim()}
    >
      {isInlineMobile ? (
        <>
          {inlineSections.map((section, index) => (
            <div
              key={section.key}
              data-site-info-section={index}
              className={sectionClassName(index, section.className)}
            >
              {section.content}
            </div>
          ))}
        </>
      ) : (
      <div className="site-info__grid">
        {isMobile ? (
          <div className="site-info__header">
            <span className="site-info__indicator text-secondary">ABC</span>
            {name}
          </div>
        ) : (
          <button
            type="button"
            className="site-info__header"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            <span className="site-info__indicator text-secondary">ABC</span>
            {name}
          </button>
        )}

        {showDetails && hasContact ? (
          <div className="site-info__section">
            <span className="site-info__indicator text-secondary">A</span>
            <div className="site-info__section-content">
              {instagram ? <p className="text-primary">{instagram}</p> : null}
              {email ? <p className="text-primary">{email}</p> : null}
              {phone ? <p className="text-primary">{phone}</p> : null}
            </div>
          </div>
        ) : null}

        {showDetails && hasAbout ? (
          <div className="site-info__section">
            <span className="site-info__indicator text-secondary">B</span>
            <p className="site-info__about text-primary">{about}</p>
          </div>
        ) : null}

        {showDetails && hasClients ? (
          <div className="site-info__section">
            <span className="site-info__indicator text-secondary">C</span>
            <ul className="site-info__clients">
              {clients.map((client) => (
                <li key={client} className="text-primary">
                  {client}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
});

SiteInfo.displayName = 'SiteInfo';
