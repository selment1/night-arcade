import XCTest
final class GameplayTests: XCTestCase {
    override func setUpWithError() throws {
        guard ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] == "Heritage-iOS-Review" else {
            throw XCTSkip("Use the dedicated Heritage-iOS-Review simulator; this suite replaces its own test save.")
        }
    }
    @MainActor func testSoloLaunchAndResume() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let solo = app.webViews.buttons["CPUと遊ぶ（1人プレイ）"]
        XCTAssertTrue(solo.waitForExistence(timeout: 30), app.debugDescription)
        XCTAssertTrue(app.webViews.staticTexts["未接続"].waitForExistence(timeout: 30))
        solo.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        let resume = app.webViews.buttons["続きから"]
        if resume.waitForExistence(timeout: 3) {
            // This suite owns its isolated simulator fixture, not a user's saved journey.
            let newGame = app.webViews.buttons["新しく始める（保存を置換）"]
            XCTAssertTrue(newGame.exists)
            newGame.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
        let roll = app.webViews.buttons.matching(NSPredicate(format: "label CONTAINS %@", "サイコロ")).firstMatch
        XCTAssertTrue(roll.waitForExistence(timeout: 20), app.debugDescription)
        if !roll.isHittable { app.swipeUp() }
        roll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        let result = app.webViews.staticTexts.matching(NSPredicate(format: "label MATCHES %@", "[1-6] \\+ [1-6] = [0-9]+" )).firstMatch
        XCTAssertTrue(result.waitForExistence(timeout: 20), app.debugDescription)
        let dice = result.label
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.lifetime = .keepAlways; add(shot)
        app.terminate()
        app.launch()
        XCTAssertTrue(solo.waitForExistence(timeout: 30))
        XCTAssertTrue(app.webViews.staticTexts["未接続"].waitForExistence(timeout: 30))
        solo.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(resume.waitForExistence(timeout: 15), app.debugDescription)
        resume.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.webViews.staticTexts[dice].waitForExistence(timeout: 20), app.debugDescription)
        XCTAssertTrue(app.webViews.staticTexts["旅の資産"].exists || app.webViews.buttons["退出する"].exists, app.debugDescription)
    }
    @MainActor func testNetworkLobbyInvitation() throws {
        continueAfterFailure = false
        let app = XCUIApplication(); app.launch()
        XCTAssertTrue(app.webViews.staticTexts["未接続"].waitForExistence(timeout: 30))
        let create = app.webViews.buttons["ルームをつくる"]
        for _ in 0..<5 { if create.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(create.isHittable)
        create.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(app.webViews.staticTexts["友だちの参加を待っています"].waitForExistence(timeout: 30), app.debugDescription)
        let invitation = app.webViews.textFields["招待リンク"]
        XCTAssertTrue(invitation.waitForExistence(timeout: 10))
        XCTAssertTrue((invitation.value as? String ?? "").hasPrefix("https://selment1.github.io/night-arcade/estates/?room="))
        app.terminate()
    }
}
