from pathlib import Path
import unittest

ROOT = Path(__file__).parents[1]


class VillageAppContract(unittest.TestCase):
    def test_mobile_adventure_has_a_playable_map_and_touch_controls(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertIn('id="game"', html)
        self.assertIn("pointerdown", js)
        self.assertIn("keydown", js)
        self.assertIn("function move", js)
        self.assertIn("function interact", js)
        self.assertIn("npc", js)
        self.assertIn("image-rendering: pixelated", css)
        self.assertIn("touch-action: none", css)

    def test_mobile_controls_use_a_drag_thumbstick_and_tap_to_talk(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertIn('id="touch-indicator"', html)
        self.assertIn('id="touch-knob"', html)
        self.assertIn("pointermove", js)
        self.assertIn("addEventListener('pointermove'", js)
        self.assertIn("#touch-indicator", css)
        # No permanent dialogue panel and no talk button — a tap near an NPC opens the conversation.
        self.assertNotIn('id="talk"', html)
        self.assertNotIn('id="dialogue"', html)
        self.assertIn('id="hint"', html)
        self.assertIn("nearest()", js)

    def test_world_is_true_3d_with_billboard_sprites_and_xz_movement(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")

        self.assertIn("vendor/babylon.js", html)
        self.assertNotIn("vendor/phaser.min.js", html)
        self.assertIn("new BABYLON.Engine", js)
        self.assertIn("new BABYLON.Scene", js)
        self.assertIn("MeshBuilder.CreateGround", js)
        self.assertIn("MeshBuilder.CreatePlane", js)
        self.assertIn("BILLBOARDMODE_Y", js)
        self.assertIn("moveWithCollisions", js)
        self.assertIn("camera.target.copyFrom", js)
        self.assertIn("const ZONES", js)
        self.assertIn("function createBuilding", js)

    def test_iphone_uses_fullscreen_map_and_anywhere_touch_joystick(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertNotIn('id="joystick"', html)
        self.assertIn('id="touch-indicator"', html)
        self.assertIn("addEventListener('pointerdown'", js)
        self.assertIn("pointercancel", js)
        self.assertIn("engine.resize()", js)
        self.assertIn("100dvh", css)
        self.assertIn("position:fixed", css.replace(" ", ""))
        self.assertIn("inset:0", css.replace(" ", ""))

    def test_character_is_large_and_touch_movement_is_responsive(self):
        js = (ROOT / "game.js").read_text(encoding="utf-8")

        self.assertIn("const MOVE_SPEED=280", js)
        self.assertIn("const CHARACTER_SCALE=1.75", js)
        self.assertIn("hero-walk.png", js)
        self.assertIn("setSpriteFrame", js)
        self.assertIn("{down:0,left:1,right:2,up:3}", js)
        self.assertIn("animatePlayer", js)
        self.assertIn("moveWithCollisions", js)

    def test_game_uses_local_babylon_engine_with_3d_camera_lighting_and_postprocess(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertIn('vendor/babylon.js', html)
        self.assertIn("new BABYLON.Engine", js)
        self.assertIn("new BABYLON.Scene", js)
        self.assertIn("new BABYLON.HemisphericLight", js)
        self.assertIn("new BABYLON.DirectionalLight", js)
        self.assertIn("new BABYLON.ShadowGenerator", js)
        self.assertIn("new BABYLON.DefaultRenderingPipeline", js)
        self.assertIn("depthOfFieldEnabled", js)
        self.assertIn("bloomEnabled", js)
        self.assertIn("function loadAssets", js)
        self.assertIn("assets/buildings/${key}.png", js)
        self.assertIn("'guild','magic','alchemy','smithy','tavern'", js)
        self.assertIn("new BABYLON.StandardMaterial", js)
        self.assertIn("npc-idle-${i}.png", js)
        self.assertIn("function createGround", js)
        self.assertIn("function createTown", js)
        self.assertIn("BABYLON.Camera.ORTHOGRAPHIC_CAMERA", js)
        self.assertIn("createEnvironmentEffects", js)
        self.assertIn("pipeline.imageProcessing.vignetteEnabled", js)
        self.assertIn("backdrop-filter:blur", css)
        self.assertIn("radial-gradient", css)
        self.assertIn("mix-blend-mode", css)
        self.assertIn("[-31,-26,-21,-16,-7,-2,3,8,15,20,25,30]", js)
        fantasy_buildings = ["guild", "magic", "alchemy", "smithy", "tavern", "bakery", "flower", "chapel", "home", "clocktower", "market"]
        for key in fantasy_buildings:
            self.assertTrue((ROOT / f"assets/buildings/{key}.png").exists(), key)
            self.assertIn(f"'{key}'", js)
        self.assertIn("npc-idle-${i}.png", js)
        self.assertTrue((ROOT / "assets/village-cg-5.png").exists())
        self.assertIn("name:'艾妲'", js)
        self.assertIn("name:'凱恩'", js)
        self.assertIn("name:'菲菲'", js)
        self.assertEqual(js.count(",face:"), 6)
        for index in range(6):
            self.assertTrue((ROOT / f"assets/npcs/npc-idle-{index}.png").exists())
            self.assertTrue((ROOT / f"assets/village-cg-{index}.png").exists())

    def test_foreground_houses_sit_low_in_the_portrait_frame(self):
        js = (ROOT / "game.js").read_text(encoding="utf-8")

        self.assertIn("x, 8.2, 6.0, 5.0", js)

    def test_dialogue_opens_fullscreen_character_cg_and_completes_story(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertIn('id="story"', html)
        self.assertIn('id="story-cg"', html)
        self.assertIn('id="story-text"', html)
        self.assertIn("function advanceStory", js)
        self.assertIn("endStory", js)
        self.assertIn("village-cg-0.png", html)
        self.assertIn("village-cg-${npc.face}.png", js)
        self.assertIn("#story.active", css)


if __name__ == "__main__":
    unittest.main()
