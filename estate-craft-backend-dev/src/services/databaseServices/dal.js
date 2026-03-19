class Dal {
	constructor(model, modelName) {
		this.model = model;
		this.modelName = modelName;
	}

	getModel(tx) {
		return tx ? tx[this.modelName] : this.model;
	}

	create(data, tx) {
		return this.getModel(tx).create({ ...data });
	}

	createMany(data, tx) {
		return this.getModel(tx).createMany({ ...data });
	}

	findMany(params, tx) {
		return this.getModel(tx).findMany({ ...params });
	}

	findOne(params, tx) {
		return this.getModel(tx).findUnique({ ...params });
	}

	findFirst(params, tx) {
		return this.getModel(tx).findFirst({ ...params });
	}

	update(params, tx) {
		return this.getModel(tx).update({ ...params });
	}

	updateMany(params, tx) {
		return this.getModel(tx).updateMany({ ...params });
	}

	upsert(params, tx) {
		return this.getModel(tx).upsert({ ...params });
	}

	deleteMany(params, tx) {
		return this.getModel(tx).deleteMany({ ...params });
	}

	delete(params, tx) {
		return this.getModel(tx).delete({ ...params });
	}

	count(params, tx) {
		return this.getModel(tx).count({ ...params });
	}

	aggregate(params, tx) {
		return this.getModel(tx).aggregate({ ...params });
	}

	groupBy(params, tx) {
		return this.getModel(tx).groupBy({ ...params });
	}
}

export default Dal;
