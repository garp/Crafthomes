class FilterFunction {
	constructor() {
		this.filter = this.filter.bind(this);
	}

	getUserClientFilter() {
		const filter = {};
		return filter;
	}

	getUserVendorFilter() {
		const filter = {
			status: 'ACTIVE',
			AND: [
				{
					OR: [{ organization: null }, { organization: { not: SERVER.VENDOR_ORG } }],
				},
			],
		};
		return filter;
	}
}

export default new FilterFunction();
