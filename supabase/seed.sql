-- ─── DevLinks demo seed ───────────────────────────────────────────────────────
--
-- Inserts a demo user and 3 public collections with real developer resources.
-- Run automatically by `supabase db reset` (Supabase CLI reads supabase/seed.sql).
--
-- This file is idempotent: every INSERT uses ON CONFLICT DO NOTHING so it is
-- safe to run multiple times.
--
-- Collections:
--   1. React Debugging   (slug: react-debugging)
--   2. CSS Layout        (slug: css-layout)
--   3. API / Auth        (slug: api-auth)
--
-- Bookmark normalized_url and search_text are computed by the
-- bookmarks_sync_derived_fields BEFORE INSERT trigger, so we provide '' as
-- placeholders and the trigger fills the correct values in.

-- ─── Demo user in auth ────────────────────────────────────────────────────────

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@devlinks.app',
  -- Not a real password — this account is only used via OAuth in production.
  -- For local testing you can sign in with the Supabase Studio user management UI.
  crypt('devlinks-demo-not-a-real-password', gen_salt('bf')),
  now(),
  '{"provider": "github", "providers": ["github"]}',
  '{"user_name": "devlinks-demo", "full_name": "DevLinks Demo", "avatar_url": "https://avatars.githubusercontent.com/u/0"}',
  now(),
  now(),
  false,
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

-- ─── Demo user profile ────────────────────────────────────────────────────────

insert into public.profiles (id, email, github_username, display_name, avatar_url)
values (
  '00000000-0000-0000-0000-000000000001',
  'demo@devlinks.app',
  'devlinks-demo',
  'DevLinks Demo',
  'https://avatars.githubusercontent.com/u/0'
)
on conflict (id) do nothing;

-- ─── Collections ──────────────────────────────────────────────────────────────

insert into public.collections (id, user_id, name, description, slug, is_public)
values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'React Debugging',
    'Tools, patterns, and mental models for tracking down bugs and performance issues in React apps.',
    'react-debugging',
    true
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'CSS Layout',
    'The best references and interactive guides for mastering CSS Grid, Flexbox, and modern layout primitives.',
    'css-layout',
    true
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'API / Auth',
    'Authoritative resources on REST API design, HTTP fundamentals, OAuth, JWT, and API security.',
    'api-auth',
    true
  )
on conflict (id) do nothing;

-- ─── React Debugging bookmarks ────────────────────────────────────────────────

insert into public.bookmarks (
  id, user_id, collection_id, title, url, normalized_url,
  description, domain, favicon_url, image_url, resource_type, tags
)
values

  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'React Developer Tools',
    'https://react.dev/learn/react-developer-tools',
    '',  -- computed by trigger
    'Install the official React DevTools browser extension to inspect component trees, props, state, and hooks in the browser.',
    'react.dev', null, null, 'tool',
    array['react','devtools','debugging','browser-extension']
  ),

  (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'How to Use React DevTools',
    'https://www.freecodecamp.org/news/how-to-use-react-dev-tools/',
    '',
    'A practical walkthrough of React DevTools features: component inspection, props editing, profiler tab, and hunting down unnecessary re-renders.',
    'freecodecamp.org', null, null, 'article',
    array['react','debugging','devtools','performance']
  ),

  (
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Error Boundaries — React Docs',
    'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
    '',
    'Class component lifecycle method for catching render errors in subtrees. The de-facto pattern for graceful UI degradation in React.',
    'react.dev', null, null, 'documentation',
    array['react','error-handling','error-boundary','resilience']
  ),

  (
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'why-did-you-render',
    'https://github.com/welldone-software/why-did-you-render',
    '',
    'Monkey-patches React to notify you about avoidable re-renders. Invaluable for tracking down props/state equality issues causing excess work.',
    'github.com', null, null, 'repo',
    array['react','performance','re-renders','debugging']
  ),

  (
    '00000000-0000-0000-0002-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'React Profiler API',
    'https://react.dev/reference/react/Profiler',
    '',
    'Built-in Profiler component for measuring render cost of any subtree programmatically. Works in production builds unlike the DevTools profiler.',
    'react.dev', null, null, 'documentation',
    array['react','performance','profiling','rendering']
  ),

  (
    '00000000-0000-0000-0002-000000000006',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Fix the Slow Render Before You Fix the Re-render',
    'https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render',
    '',
    'Kent C. Dodds argues that making individual renders fast matters more than eliminating them. A clear mental model shift for performance debugging.',
    'kentcdodds.com', null, null, 'article',
    array['react','performance','optimization','re-renders']
  ),

  (
    '00000000-0000-0000-0002-000000000007',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'A Visual Guide to React Rendering',
    'https://alexsidorenko.com/blog/react-render-always-rerenders/',
    '',
    'Animated diagrams showing exactly when and why React re-renders components. Covers the same-reference vs. new-object trap and context propagation.',
    'alexsidorenko.com', null, null, 'article',
    array['react','rendering','mental-model','visualization']
  ),

  (
    '00000000-0000-0000-0002-000000000008',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'React Strict Mode',
    'https://react.dev/reference/react/StrictMode',
    '',
    'Wraps subtrees to surface deprecated APIs, double-invoke effects, and detect accidental side effects during development. Enable it early.',
    'react.dev', null, null, 'documentation',
    array['react','strict-mode','debugging','best-practices']
  )

on conflict (id) do nothing;

-- ─── CSS Layout bookmarks ─────────────────────────────────────────────────────

insert into public.bookmarks (
  id, user_id, collection_id, title, url, normalized_url,
  description, domain, favicon_url, image_url, resource_type, tags
)
values

  (
    '00000000-0000-0000-0002-000000000009',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'A Complete Guide to CSS Grid',
    'https://css-tricks.com/snippets/css/complete-guide-grid/',
    '',
    'The definitive CSS Grid reference on CSS-Tricks. Covers every property with clear diagrams. Bookmark and consult constantly.',
    'css-tricks.com', null, null, 'article',
    array['css','grid','layout','reference']
  ),

  (
    '00000000-0000-0000-0002-000000000010',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'A Complete Guide to Flexbox',
    'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
    '',
    'CSS-Tricks'' canonical Flexbox reference. Container vs. item properties, axis visualisations, and real-world alignment patterns.',
    'css-tricks.com', null, null, 'article',
    array['css','flexbox','layout','reference']
  ),

  (
    '00000000-0000-0000-0002-000000000011',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'Every Layout',
    'https://every-layout.dev',
    '',
    'Andy Bell and Heydon Pickering''s collection of intrinsic, composable CSS layout primitives: Stack, Box, Center, Cluster, Sidebar, and more.',
    'every-layout.dev', null, null, 'course',
    array['css','layout','design-patterns','intrinsic']
  ),

  (
    '00000000-0000-0000-0002-000000000012',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'Grid Garden',
    'https://cssgridgarden.com',
    '',
    'Learn CSS Grid by writing code to grow a carrot garden. 28 interactive levels covering grid-column, grid-row, grid-area, and span.',
    'cssgridgarden.com', null, null, 'tool',
    array['css','grid','interactive','learning']
  ),

  (
    '00000000-0000-0000-0002-000000000013',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'Flexbox Froggy',
    'https://flexboxfroggy.com',
    '',
    'A game for learning CSS Flexbox. 24 levels that teach justify-content, align-items, flex-direction, flex-wrap, and flex-flow.',
    'flexboxfroggy.com', null, null, 'tool',
    array['css','flexbox','interactive','learning']
  ),

  (
    '00000000-0000-0000-0002-000000000014',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'Understanding CSS Grid Lines',
    'https://www.smashingmagazine.com/2020/01/understanding-css-grid-lines/',
    '',
    'Rachel Andrew dives into named grid lines, implicit vs. explicit grids, and placement algorithms. Essential for mastering complex layouts.',
    'smashingmagazine.com', null, null, 'article',
    array['css','grid','layout','advanced']
  ),

  (
    '00000000-0000-0000-0002-000000000015',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'CSS Container Queries',
    'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries',
    '',
    'MDN reference for container queries — responsive design based on a parent container''s size rather than the viewport. Now baseline across all browsers.',
    'developer.mozilla.org', null, null, 'documentation',
    array['css','container-queries','responsive','layout']
  ),

  (
    '00000000-0000-0000-0002-000000000016',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'An Interactive Guide to CSS Grid',
    'https://www.joshwcomeau.com/css/interactive-guide-to-grid/',
    '',
    'Josh Comeau''s signature interactive deep-dive into CSS Grid. Live playgrounds explain implicit/explicit tracks, auto-fill vs auto-fit, and subgrid.',
    'joshwcomeau.com', null, null, 'article',
    array['css','grid','interactive','deep-dive']
  )

on conflict (id) do nothing;

-- ─── API / Auth bookmarks ─────────────────────────────────────────────────────

insert into public.bookmarks (
  id, user_id, collection_id, title, url, normalized_url,
  description, domain, favicon_url, image_url, resource_type, tags
)
values

  (
    '00000000-0000-0000-0002-000000000017',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'JWT.io Debugger',
    'https://jwt.io',
    '',
    'Paste any JWT to decode its header and payload, verify signatures with a secret or public key, and generate tokens for testing.',
    'jwt.io', null, null, 'tool',
    array['jwt','auth','tokens','debugging']
  ),

  (
    '00000000-0000-0000-0002-000000000018',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'OAuth 2.0 Simplified',
    'https://www.oauth.com',
    '',
    'Aaron Parecki''s authoritative guide to OAuth 2.0 flows: authorization code, PKCE, client credentials, device code, and token refresh.',
    'oauth.com', null, null, 'article',
    array['oauth','auth','authorization','security']
  ),

  (
    '00000000-0000-0000-0002-000000000019',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'Supabase Auth Documentation',
    'https://supabase.com/docs/guides/auth',
    '',
    'Complete Supabase auth guide: email/password, magic links, OAuth providers (GitHub, Google), Row Level Security integration, and session management.',
    'supabase.com', null, null, 'documentation',
    array['supabase','auth','oauth','rls']
  ),

  (
    '00000000-0000-0000-0002-000000000020',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'HTTP — MDN Overview',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
    '',
    'Foundational MDN overview of the HTTP protocol: request/response cycle, methods, headers, status codes, caching, and cookies.',
    'developer.mozilla.org', null, null, 'documentation',
    array['http','api','web','fundamentals']
  ),

  (
    '00000000-0000-0000-0002-000000000021',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'REST API Design Best Practices',
    'https://www.freecodecamp.org/news/rest-api-best-practices-rest-endpoint-design-examples/',
    '',
    'Practical guide to REST endpoint naming, HTTP method usage, versioning, error response shapes, and pagination conventions.',
    'freecodecamp.org', null, null, 'article',
    array['rest','api','design','best-practices']
  ),

  (
    '00000000-0000-0000-0002-000000000022',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'HTTP Status Codes Reference',
    'https://httpstatuses.io',
    '',
    'Quick-reference for every HTTP status code with plain-language explanations. Essential when designing or debugging API responses.',
    'httpstatuses.io', null, null, 'documentation',
    array['http','status-codes','api','reference']
  ),

  (
    '00000000-0000-0000-0002-000000000023',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'OWASP API Security Top 10',
    'https://owasp.org/www-project-api-security/',
    '',
    'The definitive list of the most critical API security risks: broken object-level auth, excessive data exposure, mass assignment, and more.',
    'owasp.org', null, null, 'documentation',
    array['security','api','owasp','best-practices']
  ),

  (
    '00000000-0000-0000-0002-000000000024',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'Hoppscotch — Open Source API Client',
    'https://hoppscotch.io',
    '',
    'Browser-based API client supporting REST, GraphQL, WebSockets, and SSE. Useful for quickly testing endpoints without installing Postman.',
    'hoppscotch.io', null, null, 'tool',
    array['api','testing','rest','graphql']
  )

on conflict (id) do nothing;
