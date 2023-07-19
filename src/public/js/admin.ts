const deleteProduct = async (btn: HTMLButtonElement) => {
	const productId = btn.parentNode?.querySelector<HTMLInputElement>("[name=productId]")?.value;
	const csrfToken = btn.parentNode?.querySelector<HTMLInputElement>("[name=_csrf]")?.value;
	console.log({
		productId: productId,
		csrfToken: csrfToken,
	});
	const response = await fetch(`/admin/product/${productId}`, {
		method: "DELETE",
		headers: {
			"csrf-token": csrfToken as string,
		},
	});
	const data: { message: string } = await response.json();
	console.log(data);
	if (data.message === "File deleted successfully") {
		btn.closest("article")?.remove();
	}
};
