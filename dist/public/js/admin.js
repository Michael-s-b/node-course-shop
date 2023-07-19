"use strict";
const deleteProduct = async (btn) => {
    const productId = btn.parentNode?.querySelector("[name=productId]")?.value;
    const csrfToken = btn.parentNode?.querySelector("[name=_csrf]")?.value;
    console.log({
        productId: productId,
        csrfToken: csrfToken,
    });
    const response = await fetch(`/admin/product/${productId}`, {
        method: "DELETE",
        headers: {
            "csrf-token": csrfToken,
        },
    });
    const data = await response.json();
    console.log(data);
    if (data.message === "File deleted successfully") {
        btn.closest("article")?.remove();
    }
};
