interface ModalProps {
  children: React.ReactNode;
  title: string;
  visible: boolean;
  onClose: () => void;
}

export function Modal({ children, title, visible, onClose }: ModalProps) {
  const showClass = `${visible ? "show" : ""}`;
  const style = visible ? { display: "block" } : {};
  return (
    <>
      {visible && <div className="modal-backdrop fade show"></div>}
      <div
        className={`modal modal-lg fade ${showClass}`}
        style={style}
        tabIndex={-1}
        onAnimationEnd={() => {}}
      >
        <div className="modal-dialog">
          <div className="modal-content rounded-3">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => onClose()}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}