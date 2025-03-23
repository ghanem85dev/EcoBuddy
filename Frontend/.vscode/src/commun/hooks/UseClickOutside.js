import { useEffect } from "react";

export const useClickOutside = (refs, callback) => {
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!Array.isArray(refs)) return;
            
            const isOutside = refs.every((ref) => ref?.current && !ref.current.contains(event.target));

            if (isOutside && typeof callback === "function") {
                callback(event);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [callback, refs]);
};
