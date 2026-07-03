'use client';

import { forwardRef, useState } from 'react';

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
  className?: string;
};

export const SiteInfo = forwardRef<HTMLDivElement, SiteInfoProps>(function SiteInfo(
  { information, isMobile = false, className },
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
  const showDetails = isMobile || expanded;

  const name = (
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

  return (
    <div
      ref={ref}
      className={`site-info ${expanded ? 'site-info--expanded' : ''} ${className ?? ''}`.trim()}
    >
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
    </div>
  );
});

SiteInfo.displayName = 'SiteInfo';
