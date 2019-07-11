import React from 'react';

type Props = {
  toolbar: Array<Object>,
  open: Boolean,
  customClass: String
};

const areEqual = (prevProps, nextProps) => {
  const prevInbox = prevProps.toolbar[1].component().props.inbox;
  const nextInbox = nextProps.toolbar[1].component().props.inbox;

  if (prevInbox.length !== nextInbox.length) {
    return false;
  }

  return true;
};

const Toolbar = React.memo(
  ({ toolbar, open, customClass }: Props) => (
    <nav className="nav nav__toolbar">
      <ul>
        {toolbar &&
          toolbar.map(({ component: Component, props }, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i} data-testid="item">
              <Component {...props} open={open} customClass={customClass} />
            </li>
          ))}
      </ul>
    </nav>
  ),
  areEqual
);

export default Toolbar;
