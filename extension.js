import { lib, game, ui, get, ai, _status } from "../../noname.js";
import characters from "./character.js";
import dynamicTranslates from "./dynamicTranslate.js";
import characterReplaces from "./characterReplace.js";
import { characterSort, characterSortTranslate } from "./sort.js";
import characterFilters from "./characterFilter.js";
import cards from "./card.js";
import translates from "./translate.js";
import cardTranslates from "./cardTranslate.js";
import characterIntros from "./intro.js";
import voices from "./voices.js";
import skills from "./skill.js";
import guozhanSkills from "./guozhanSkill.js";
export const type = "extension";
export default function () {
	return {
		name: "阴阳师",

		content: function (config, pack) {
			//把写的国战武将加入国战武将专属武将包
			if (lib.characterPack.mode_guozhan && pack.character.characterSort.阴阳师.阴阳师_guozhan) {
				let characters = pack.character.characterSort.阴阳师.阴阳师_guozhan;
				for (var char of characters) {
					lib.characterPack.mode_guozhan[char] = pack.character.character[char];
				}
				lib.perfectPair["yuanlaiguang"] = ["guiqie"];
				lib.perfectPair["lingluyuqian"] = ["qianji", "dayuewan"];
				lib.perfectPair["huangchuanzhizhu"] = ["jinyuji"];
				lib.characterSort.mode_guozhan["guozhan_yys"] = pack.character.characterSort.阴阳师.阴阳师_guozhan;
				lib.translate["guozhan_yys"] = "阴阳师";
			}

			//小窗提示1
			lib.poptip.add({
				id: "fumianxiaoguo",
				name: "负面效果",
				info: "横置、翻面、判定区的牌、非武将牌上的技能和标记",
				type: "rule", //可不填，默认rule
			});
			//小窗提示2
			lib.poptip.add({
				id: "xingdongji",
				name: "行动技",
				info: "含有增加行动条的技能，行动条起始为0，当任意回合结束时，若行动条超过100%，则执行一个新的回合并重置行动条。",
				type: "rule", //可不填，默认rule
			});

			//技能换肤
			lib.characterSubstitute = {
				mr_ji: [
					["mr_ji_spring", ["ext:阴阳师/character/mr_ji/mr_ji_spring.jpg"]],
					["mr_ji_summer", ["ext:阴阳师/character/mr_ji/mr_ji_summer.jpg"]],
					["mr_ji_fall", ["ext:阴阳师/character/mr_ji/mr_ji_fall.jpg"]],
					["mr_ji_winter", ["ext:阴阳师/character/mr_ji/mr_ji_winter.jpg"]],
				],
				mr_huojinshen: [["mr_huojinshen_juexing", ["ext:阴阳师/character/mr_huojinshen/mr_huojinshen_juexing.jpg"]]],
				mr_huoqubing: [
					["mr_huoqubing_initial", ["ext:阴阳师/character/mr_huoqubing/mr_huoqubing_initial.jpg"]],
					["mr_huoqubing_win1", ["ext:阴阳师/character/mr_huoqubing/mr_huoqubing_win1.jpg"]],
					["mr_huoqubing_win2", ["ext:阴阳师/character/mr_huoqubing/mr_huoqubing_win2.jpg"]],
					["mr_huoqubing_fail", ["ext:阴阳师/character/mr_huoqubing/mr_huoqubing_fail.jpg"]],
				],
				mr_yao: [
					["mr_yao_ren", ["ext:阴阳师/character/mr_yao/mr_yao_ren.jpg"]],
					["mr_yao_lu", ["ext:阴阳师/character/mr_yao/mr_yao_lu.jpg"]],
				],
				mr_duoliya: [
					["mr_duoliya_ren", ["ext:阴阳师/character/mr_duoliya/mr_duoliya_ren.png"]],
					["mr_duoliya_yu", ["ext:阴阳师/character/mr_duoliya/mr_duoliya_yu.png"]],
					["mr_duoliya_both", ["ext:阴阳师/character/mr_duoliya/mr_duoliya_both.jpg"]],
				],
				mr_huajiao: [["mr_huajiao_final", ["ext:阴阳师/character/mr_huajiao/mr_huajiao_final.jpeg"]]],
				mr_buzhihuo: [["mr_buzhihuo_awaken", ["ext:阴阳师/character/mr_buzhihuo/mr_buzhihuo_awaken.png"]]],
				mr_guiwangjiutuntongzi: [
					["mr_guiwangjiutuntongzi_guiwangzitai", ["ext:阴阳师/character/mr_guiwangjiutuntongzi/mr_guiwangjiutuntongzi_guiwangzitai.png"]],
					["mr_guiwangjiutuntongzi_initial", ["ext:阴阳师/character/mr_guiwangjiutuntongzi/mr_guiwangjiutuntongzi_initial.png"]],
				],
				mrda_yuanxiaoyuan: [
					["mrda_yuanxiaoyuan_xiaoyuan", ["ext:阴阳师/character/mrda_yuanxiaoyuan/mrda_yuanxiaoyuan_xiaoyuan.jpg"]],
					["mrda_yuanxiaoyuan_dayuan", ["ext:阴阳师/character/mrda_yuanxiaoyuan/mrda_yuanxiaoyuan_dayuan.png"]],
				],
				mr_shaosiyuan: [
					["mr_shaosiyuan_yys", ["ext:阴阳师/character/mr_shaosiyuan/mr_shaosiyuan_yys.png"]],
					["mr_shaosiyuan_nong", ["ext:阴阳师/character/mr_shaosiyuan/mr_shaosiyuan_nong.jpeg"]],
				],
				mrmou_shaosiyuan: [
					["mrmou_shaosiyuan_initial", ["ext:阴阳师/character/mrmou_shaosiyuan/mrmou_shaosiyuan_initial.jpg"]],
					["mrmou_shaosiyuan_zhanbai", ["ext:阴阳师/character/mrmou_shaosiyuan/mrmou_shaosiyuan_zhanbai.png"]],
				],
			};
		},

		precontent: function () {
			//自定义势力
			/** 推荐方法
			 * @param {string} id: 势力ID
			 * @param {string} short: 势力名称，单字
			 * @param {string} name: 势力全名，使用 get.translation(id2)可以获取，不填默认为short
			 * @param {object} config:势力配置，支持color与image两种参数。
			 *
			 */
			var id = "yys";
			var short = "阴";
			var name = "阴阳师";
			var config = {
				color: "#FFC0CB",
			};
			game.addGroup(id, short, name, config);

			var id2 = "nong";
			var short2 = "农";
			var name2 = "王者荣耀";
			var config2 = {
				color: "#F6EA10",
			};
			game.addGroup(id2, short2, name2, config2);

			var id3 = "san";
			var short3 = "三";
			var name3 = "三体";
			var config3 = {
				color: "#7810F6",
			};
			game.addGroup(id3, short3, name3, config3);

			//武将名字前缀设置
			lib.namePrefix.set("轮椅", { color: "red" });
		},

		help: {},

		config: {},

		package: {
			character: {
				character: { ...characters },
				characterSort: {
					阴阳师: characterSort,
				},
				characterFilter: { ...characterFilters },
				dynamicTranslate: { ...dynamicTranslates },
				characterIntro: { ...characterIntros },
				characterReplace: { ...characterReplaces },
			},
			card: {
				card: { ...cards },
				translate: { ...cardTranslates },
			},
			skill: {
				skill: { ...skills, ...guozhanSkills },
				translate: { ...translates, ...voices, ...characterSortTranslate },
			},
			intro: "赛博阴阳师",
			author: "瑾",
			diskURL: "",
			forumURL: "",
			version: "1.0",
		},
		files: { character: [], card: [], skill: [], audio: [] },
		connect: false,
	};
}
