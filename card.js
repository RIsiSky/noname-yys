import { lib, game, ui, get, ai, _status } from "../../noname.js";

const cards = {
	mryingshengchong: {
		type: "equip",
		subtype: "equip5",
		nomod: true,
		forceDie: true,
		clearLose: true,
		equipDelay: false,
		loseDelay: false,
		skills: ["mrxiezhan"],
		selectTarget: -1,
		filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
		modTarget: true,
		allowMultiple: false,
		content: function () {
			if (
				!card?.cards.some(card => {
					return get.position(card, true) !== "o";
				})
			) {
				target.equip(card);
			}
			//if (cards.length && get.position(cards[0], true) == "o") target.equip(cards[0]);
		},
		toself: true,
		image: "ext:阴阳师/card/mryingshengchong.png",
		enable: true,
		ai: {
			basic: {
				order: (card, player) => {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				equipValue: 3,
				value: (card, player, index, method) => {
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") return equipValue(card, player);
						if (method == "raw2") return equipValue(card, player) - value;
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") equipValue = 0;
					if (method == "raw") return equipValue;
					if (method == "raw2") return equipValue - value;
					return Math.max(0.1, equipValue - value);
				},
			},
			result: {
				target: (player, target, card) => get.equipResult(player, target, card),
			},
		},
		fullskin: true,
	},
	mrfangyuanchui: {
		image: "ext:阴阳师/card/mrfangyuanchui.png",
		audio: true,
		fullskin: true,
		type: "equip",
		subtype: "equip2",
		nomod: true,
		nopower: true,
		unique: true,
		skills: ["mr_fangyuanchui"],
		ai: {
			equipValue(card, player) {
				if (player.hasSkill("mryuanjin")) return 9;
				if (
					game.hasPlayer(function (current) {
						return current.hasSkill("mryuanjin") && get.attitude(player, current) <= 0;
					})
				) {
					return 1;
				}
				return 6;
			},
			basic: {
				equipValue: 6,
				order: (card, player) => {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				value: (card, player, index, method) => {
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") return equipValue(card, player);
						if (method == "raw2") return equipValue(card, player) - value;
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") equipValue = 0;
					if (method == "raw") return equipValue;
					if (method == "raw2") return equipValue - value;
					return Math.max(0.1, equipValue - value);
				},
			},
			result: {
				target: (player, target, card) => get.equipResult(player, target, card),
			},
		},
		filterLose(card, player) {
			if (player.hasSkillTag("unequip2")) return false;
			return true;
		},
		loseDelay: false,
		enable: true,
		selectTarget: -1,
		filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
		modTarget: true,
		allowMultiple: false,
		content: function () {
			if (
				!card?.cards.some(card => {
					return get.position(card, true) !== "o";
				})
			) {
				target.equip(card);
			}
			//if (cards.length && get.position(cards[0], true) == "o") target.equip(cards[0]);
		},
		toself: true,
	},
	mrkuanggu: {
		image: "ext:阴阳师/card/mrkuanggu.png",
		audio: true,
		fullskin: true,
		type: "equip",
		subtype: "equip1",
		distance: {
			attackFrom: -2,
		},
		nomod: true,
		nopower: true,
		unique: true,
		skills: ["mr_kuanggu"],
		ai: {
			equipValue(card, player) {
				if (player.hasSkill("mryuanjin")) return 9;
				if (
					game.hasPlayer(function (current) {
						return current.hasSkill("mryuanjin") && get.attitude(player, current) <= 0;
					})
				) {
					return 1;
				}
				return 6;
			},
			basic: {
				equipValue: 6,
				order: (card, player) => {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				value: (card, player, index, method) => {
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") return equipValue(card, player);
						if (method == "raw2") return equipValue(card, player) - value;
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") equipValue = 0;
					if (method == "raw") return equipValue;
					if (method == "raw2") return equipValue - value;
					return Math.max(0.1, equipValue - value);
				},
			},
			result: {
				target: (player, target, card) => get.equipResult(player, target, card),
			},
		},
		filterLose(card, player) {
			if (player.hasSkillTag("unequip2")) return false;
			return true;
		},
		loseDelay: false,
		enable: true,
		selectTarget: -1,
		filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
		modTarget: true,
		allowMultiple: false,
		content: function () {
			if (
				!card?.cards.some(card => {
					return get.position(card, true) !== "o";
				})
			) {
				target.equip(card);
			}
			//if (cards.length && get.position(cards[0], true) == "o") target.equip(cards[0]);
		},
		toself: true,
	},
	mrsanwei: {
		image: "ext:阴阳师/card/mrsanwei.png",
		fullskin: true,
		type: "equip",
		subtype: "equip4",
		distance: {
			globalFrom: -1,
		},
		enable: true,
		unique: true,
		selectTarget: -1,
		skills: ["mr_sanwei"],
		filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
		modTarget: true,
		allowMultiple: false,
		content: function () {
			if (
				!card?.cards.some(card => {
					return get.position(card, true) !== "o";
				})
			) {
				target.equip(card);
			}
			//if (cards.length && get.position(cards[0], true) == "o") target.equip(cards[0]);
		},
		toself: true,
		ai: {
			basic: {
				order: (card, player) => {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				equipValue: 4,
				value: (card, player, index, method) => {
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") return equipValue(card, player);
						if (method == "raw2") return equipValue(card, player) - value;
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") equipValue = 0;
					if (method == "raw") return equipValue;
					if (method == "raw2") return equipValue - value;
					return Math.max(0.1, equipValue - value);
				},
			},
			result: {
				target: (player, target, card) => get.equipResult(player, target, card),
			},
		},
	},
	mrdizang: {
		image: "ext:阴阳师/card/mrdizang.png",
		fullskin: true,
		type: "equip",
		subtype: "equip3",
		distance: {
			globalTo: 1,
		},
		enable: true,
		unique: true,
		selectTarget: -1,
		skills: ["mr_dizang"],
		filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
		modTarget: true,
		allowMultiple: false,
		content: function () {
			if (
				!card?.cards.some(card => {
					return get.position(card, true) !== "o";
				})
			) {
				target.equip(card);
			}
			//if (cards.length && get.position(cards[0], true) == "o") target.equip(cards[0]);
		},
		toself: true,
		ai: {
			basic: {
				order: (card, player) => {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				equipValue: 7,
				value: (card, player, index, method) => {
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") return equipValue(card, player);
						if (method == "raw2") return equipValue(card, player) - value;
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") equipValue = 0;
					if (method == "raw") return equipValue;
					if (method == "raw2") return equipValue - value;
					return Math.max(0.1, equipValue - value);
				},
			},
			result: {
				target: (player, target, card) => get.equipResult(player, target, card),
			},
		},
	},
	mrkuangmo: {
		fullimage: true,
		image: "ext:阴阳师/card/mrkuangmo.png",
		audio: true,
		fullskin: true,
		type: "trick",
		enable: true,
		selectTarget: -1,
		cardcolor: "black",
		toself: true,
		filterTarget(card, player, target) {
			return target == player;
		},
		modTarget: true,
		content() {
			game.players.forEach(p => {
				if (p.hasMark("mrmoling_yihuo")) p.removeMark("mrmoling_yihuo");
			});
		},
		ai: {
			wuxie(target, card, player, viewer) {
				return 0;
			},
			basic: {
				order: 3,
				useful: 1,
			},
			result: {
				target: 1,
			},
		},
	},
	mrshandianbishou: {
		image: "",
		audio: true,
		fullskin: true,
		type: "equip",
		subtype: "equip1",
		distance: {
			attackFrom: -3,
		},
		nomod: true,
		nopower: true,
		unique: true,
		image: "ext:阴阳师/card/mrshandianbishou.png",
		skills: ["mr_shandianbishou"],
		ai: {
			basic: {
				equipValue: 6,
				order: (card, player) => {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				value: (card, player, index, method) => {
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") return equipValue(card, player);
						if (method == "raw2") return equipValue(card, player) - value;
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") equipValue = 0;
					if (method == "raw") return equipValue;
					if (method == "raw2") return equipValue - value;
					return Math.max(0.1, equipValue - value);
				},
			},
			result: {
				target: (player, target, card) => get.equipResult(player, target, card),
			},
		},
		filterLose(card, player) {
			if (player.hasSkillTag("unequip2")) return false;
			return true;
		},
		loseDelay: false,
		enable: true,
		selectTarget: -1,
		filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
		modTarget: true,
		allowMultiple: false,
		content: function () {
			if (
				!card?.cards.some(card => {
					return get.position(card, true) !== "o";
				})
			) {
				target.equip(card);
			}
			//if (cards.length && get.position(cards[0], true) == "o") target.equip(cards[0]);
		},
		toself: true,
	},
	mrhaiyuanbeiji: {
		type: "equip",
		subtype: "equip5",
		nomod: true,
		forceDie: true,
		clearLose: true,
		equipDelay: false,
		loseDelay: false,
		skills: ["mr_haiyuanbeiji"],
		selectTarget: -1,
		filterTarget: (card, player, target) => player == target && target.canEquip(card, true),
		modTarget: true,
		allowMultiple: false,
		onEquip() {
			player.storage.mr_haiyuanbeiji = 0;
			player.storage.mr_haiyuanbeiji_count = 0;
			player.storage.mr_haiyuanbeiji_beige = 0;
			player.storage.mr_haiyuanbeiji_chaosheng = 3;
			player.markSkill("mr_haiyuanbeiji");
			player.markSkill("mr_haiyuanbeiji_beige");
			player.markSkill("mr_haiyuanbeiji_chaosheng");
		},
		onLose() {
			if (!player.getVCards("e", i => i.name == "mrhaiyuanbeiji").length) {
				player.unmarkSkill("mr_haiyuanbeiji");
				player.unmarkSkill("mr_haiyuanbeiji_beige");
				player.unmarkSkill("mr_haiyuanbeiji_chaosheng");
			}
		},
		content: function () {
			if (
				!card?.cards.some(card => {
					return get.position(card, true) !== "o";
				})
			) {
				target.equip(card);
			}
			//if (cards.length && get.position(cards[0], true) == "o") target.equip(cards[0]);
		},
		toself: true,
		image: "ext:阴阳师/card/mrhaiyuanbeiji.png",
		enable: true,
		ai: {
			basic: {
				order: (card, player) => {
					const equipValue = get.equipValue(card, player) / 20;
					return player && player.hasSkillTag("reverseEquip") ? 8.5 - equipValue : 8 + equipValue;
				},
				useful: 2,
				equipValue: 5,
				value: (card, player, index, method) => {
					if (!player.getCards("e").includes(card) && !player.canEquip(card, true)) return 0.01;
					const info = get.info(card),
						current = player.getEquip(info.subtype),
						value = current && card != current && get.value(current, player);
					let equipValue = info.ai.equipValue || info.ai.basic.equipValue;
					if (typeof equipValue == "function") {
						if (method == "raw") return equipValue(card, player);
						if (method == "raw2") return equipValue(card, player) - value;
						return Math.max(0.1, equipValue(card, player) - value);
					}
					if (typeof equipValue != "number") equipValue = 0;
					if (method == "raw") return equipValue;
					if (method == "raw2") return equipValue - value;
					return Math.max(0.1, equipValue - value);
				},
			},
			result: {
				target: (player, target, card) => get.equipResult(player, target, card),
			},
		},
		fullskin: true,
	},
};
export default cards;
